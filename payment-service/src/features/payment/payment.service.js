import sequelize from "../../config/db.js";
import Payment from "./payment.model.js";
import Refund from "./refund.model.js";
import paymentProviderFactory from "../../providers/paymentProvider.factory.js";
import outboxService from "../../outbox-service/outbox.service.js";

class PaymentService {

    generatePaymentReference(prefix = "PAY") {
        const timestamp = Date.now().toString(36).toUpperCase();
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${timestamp}-${randomPart}`;
    }

    /**
     * Initializes payment using selected provider via PaymentProvider abstraction.
     */
    async initializePayment(userId, data) {
        const {
            orderId,
            amount,
            currency = "NGN",
            customerEmail,
            provider: requestedProvider,
            callbackUrl,
            metadata = {}
        } = data;

        const reference = this.generatePaymentReference();
        const providerName = (requestedProvider || process.env.DEFAULT_PAYMENT_PROVIDER || "mock").toLowerCase();

        // Resolve provider through Factory (Dependency Inversion)
        const provider = paymentProviderFactory.getProvider(providerName);

        // Call the provider abstraction
        const initResult = await provider.initializePayment({
            amount: Number(amount),
            currency,
            email: customerEmail,
            reference,
            metadata: {
                ...metadata,
                orderId,
                userId
            },
            callbackUrl
        });

        const transaction = await sequelize.transaction();

        try {
            const payment = await Payment.create(
                {
                    orderId,
                    userId,
                    amount: Number(amount),
                    currency,
                    reference,
                    provider: provider.getName(),
                    status: "pending",
                    customerEmail,
                    checkoutUrl: initResult.checkoutUrl,
                    metadata: JSON.stringify({
                        ...metadata,
                        accessCode: initResult.accessCode,
                        initRaw: initResult.raw
                    })
                },
                { transaction }
            );

            // Record outbox event for PaymentInitialized
            await outboxService.createOutboxEvent(
                "PaymentInitialized",
                {
                    paymentId: payment.id,
                    orderId: payment.orderId,
                    userId: payment.userId,
                    amount: Number(payment.amount),
                    currency: payment.currency,
                    reference: payment.reference,
                    provider: payment.provider,
                    checkoutUrl: payment.checkoutUrl
                },
                transaction
            );

            await transaction.commit();

            return {
                paymentId: payment.id,
                orderId: payment.orderId,
                reference: payment.reference,
                amount: Number(payment.amount),
                currency: payment.currency,
                status: payment.status,
                provider: payment.provider,
                checkoutUrl: payment.checkoutUrl,
                accessCode: initResult.accessCode
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Verifies payment status and publishes PaymentSuccessful or PaymentFailed.
     */
    async verifyPayment(reference, verificationParams = {}) {
        const payment = await Payment.findOne({
            where: { reference }
        });

        if (!payment) {
            throw new Error(`Payment with reference "${reference}" not found`);
        }

        if (payment.status === "successful") {
            return {
                payment,
                alreadyProcessed: true,
                status: "successful"
            };
        }

        // Resolve provider
        const providerName = payment.provider;
        const provider = paymentProviderFactory.getProvider(providerName);

        // Verify via provider abstraction
        const verifyResult = await provider.verifyPayment(reference, {
            ...verificationParams,
            amount: Number(payment.amount),
            currency: payment.currency
        });

        const isSuccess = verifyResult.status === "successful";
        const transaction = await sequelize.transaction();

        try {
            payment.status = isSuccess ? "successful" : "failed";
            payment.providerTransactionId = verifyResult.transactionId || null;
            if (isSuccess) {
                payment.paidAt = new Date();
            }

            const currentMeta = payment.metadata ? JSON.parse(payment.metadata) : {};
            payment.metadata = JSON.stringify({
                ...currentMeta,
                verifyRaw: verifyResult.raw,
                reason: verifyResult.reason || null
            });

            await payment.save({ transaction });

            // Record Outbox Event
            if (isSuccess) {
                await outboxService.createOutboxEvent(
                    "PaymentSuccessful",
                    {
                        paymentId: payment.id,
                        orderId: payment.orderId,
                        userId: payment.userId,
                        reference: payment.reference,
                        amount: Number(payment.amount),
                        currency: payment.currency,
                        provider: payment.provider,
                        transactionId: payment.providerTransactionId,
                        paidAt: payment.paidAt
                    },
                    transaction
                );
            } else {
                await outboxService.createOutboxEvent(
                    "PaymentFailed",
                    {
                        paymentId: payment.id,
                        orderId: payment.orderId,
                        userId: payment.userId,
                        reference: payment.reference,
                        amount: Number(payment.amount),
                        currency: payment.currency,
                        provider: payment.provider,
                        reason: verifyResult.reason || "Payment verification failed"
                    },
                    transaction
                );
            }

            await transaction.commit();

            return {
                payment,
                status: payment.status,
                transactionId: payment.providerTransactionId,
                amount: Number(payment.amount),
                currency: payment.currency
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Handles webhook callbacks across providers.
     */
    async handleWebhook(providerName, payload, signature, headers = {}) {
        const provider = paymentProviderFactory.getProvider(providerName);
        const webhookResult = await provider.handleWebhook(payload, signature, headers);

        if (!webhookResult || !webhookResult.reference) {
            console.warn(`[Payment Service] Webhook from ${providerName} did not return a valid reference`);
            return { handled: false };
        }

        const payment = await Payment.findOne({
            where: { reference: webhookResult.reference }
        });

        if (!payment) {
            console.warn(`[Payment Service] No payment found for webhook reference: ${webhookResult.reference}`);
            return { handled: false, reference: webhookResult.reference };
        }

        if (payment.status === "successful" && webhookResult.status === "successful") {
            return { handled: true, alreadyProcessed: true };
        }

        return await this.verifyPayment(webhookResult.reference, { rawData: webhookResult.data });
    }

    /**
     * Processes refunds for a payment.
     */
    async processRefund(paymentIdOrReference, { amount, reason }) {
        const isNumeric = !isNaN(Number(paymentIdOrReference));
        const payment = await Payment.findOne({
            where: isNumeric ? { id: Number(paymentIdOrReference) } : { reference: paymentIdOrReference }
        });

        if (!payment) {
            throw new Error("Payment not found");
        }

        if (payment.status !== "successful") {
            throw new Error(`Cannot refund payment in "${payment.status}" status`);
        }

        const refundAmount = Number(amount || payment.amount);
        if (refundAmount > Number(payment.amount)) {
            throw new Error(`Refund amount cannot exceed paid amount ($${payment.amount})`);
        }

        const provider = paymentProviderFactory.getProvider(payment.provider);
        const refundResult = await provider.processRefund({
            reference: payment.reference,
            providerTransactionId: payment.providerTransactionId,
            amount: refundAmount,
            reason
        });

        const refundReference = this.generatePaymentReference("REF");
        const transaction = await sequelize.transaction();

        try {
            const refund = await Refund.create(
                {
                    paymentId: payment.id,
                    reference: refundReference,
                    amount: refundAmount,
                    reason: reason || "Customer requested refund",
                    status: refundResult.status === "completed" ? "completed" : "pending"
                },
                { transaction }
            );

            payment.status = "refunded";
            await payment.save({ transaction });

            await outboxService.createOutboxEvent(
                "PaymentRefunded",
                {
                    refundId: refund.id,
                    paymentId: payment.id,
                    orderId: payment.orderId,
                    userId: payment.userId,
                    reference: refund.reference,
                    paymentReference: payment.reference,
                    amount: Number(refund.amount),
                    provider: payment.provider,
                    reason: refund.reason
                },
                transaction
            );

            await transaction.commit();

            return refund;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async getPaymentByReference(reference) {
        const payment = await Payment.findOne({
            where: { reference },
            include: [{ model: Refund, as: "refunds" }]
        });

        if (!payment) {
            throw new Error("Payment not found");
        }

        return payment;
    }

    async getPaymentByOrderId(orderId) {
        const payment = await Payment.findOne({
            where: { orderId },
            include: [{ model: Refund, as: "refunds" }],
            order: [["createdAt", "DESC"]]
        });

        if (!payment) {
            throw new Error(`No payment record found for order ${orderId}`);
        }

        return payment;
    }
}

export default new PaymentService();
