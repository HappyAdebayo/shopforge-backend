import paymentService from "./payment.service.js";
import paymentValidation from "./payment.validation.js";
import paymentProviderFactory from "../../providers/paymentProvider.factory.js";

class PaymentController {

    async initialize(req, res) {
        try {
            const { error, value } = paymentValidation.initialize(req.body);
            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const userId = req.user.id;
            const customerEmail = req.body.customerEmail || req.user.email;

            const payment = await paymentService.initializePayment(userId, {
                ...value,
                customerEmail
            });

            return res.status(201).json({
                message: "Payment initialized successfully",
                data: payment
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }
    }

    async verify(req, res) {
        try {
            const reference = req.body.reference || req.params.reference || req.query.reference;

            const { error, value } = paymentValidation.verify({
                ...req.body,
                ...req.query,
                reference
            });

            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const result = await paymentService.verifyPayment(value.reference, value);

            return res.status(200).json({
                message: result.status === "successful" ? "Payment verified successfully" : "Payment verification failed",
                data: result
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }
    }

    async getByReference(req, res) {
        try {
            const { reference } = req.params;
            const payment = await paymentService.getPaymentByReference(reference);

            return res.status(200).json({
                message: "Payment retrieved successfully",
                data: payment
            });
        } catch (error) {
            return res.status(404).json({
                message: error.message
            });
        }
    }

    async getByOrderId(req, res) {
        try {
            const { orderId } = req.params;
            const payment = await paymentService.getPaymentByOrderId(Number(orderId));

            return res.status(200).json({
                message: "Payment retrieved successfully",
                data: payment
            });
        } catch (error) {
            return res.status(404).json({
                message: error.message
            });
        }
    }

    async refund(req, res) {
        try {
            const { reference } = req.params;
            const { error, value } = paymentValidation.refund(req.body);
            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const refund = await paymentService.processRefund(reference, value);

            return res.status(200).json({
                message: "Refund processed successfully",
                data: refund
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }
    }

    async getSupportedProviders(req, res) {
        try {
            const providers = paymentProviderFactory.getSupportedProviders();
            const defaultProvider = process.env.DEFAULT_PAYMENT_PROVIDER || "mock";

            return res.status(200).json({
                message: "Supported providers retrieved successfully",
                data: {
                    defaultProvider,
                    providers
                }
            });
        } catch (error) {
            return res.status(500).json({
                message: error.message
            });
        }
    }

    async handleWebhook(req, res) {
        try {
            const { provider } = req.params;
            const signature = req.headers["stripe-signature"] ||
                              req.headers["x-paystack-signature"] ||
                              req.headers["verif-hash"] ||
                              "";

            const result = await paymentService.handleWebhook(provider, req.body, signature, req.headers);

            return res.status(200).json({
                message: "Webhook processed",
                data: result
            });
        } catch (error) {
            console.error(`[Payment Webhook] Error:`, error.message);
            return res.status(400).json({
                message: error.message
            });
        }
    }
}

export default new PaymentController();
