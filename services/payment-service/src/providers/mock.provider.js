import { PaymentProvider } from "./paymentProvider.base.js";

export class MockPaymentProvider extends PaymentProvider {

    constructor(config = {}) {
        super();
        this.config = config;
    }

    getName() {
        return "mock";
    }

    async initializePayment({ amount, currency = "USD", email, reference, metadata = {}, callbackUrl }) {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const redirectUrl = callbackUrl || `${frontendUrl}/checkout/mock-redirect?reference=${reference}`;
        const checkoutUrl = `${frontendUrl}/checkout/mock?reference=${reference}&amount=${amount}&currency=${currency}`;

        console.log(`[MockPaymentProvider] Initialized mock payment: Ref=${reference}, Amount=${amount} ${currency}, Email=${email}`);

        return {
            reference,
            checkoutUrl,
            accessCode: `mock_code_${reference}`,
            raw: {
                provider: "mock",
                status: "initialized",
                amount,
                currency,
                email,
                redirectUrl
            }
        };
    }

    async verifyPayment(reference, rawData = {}) {
        console.log(`[MockPaymentProvider] Verifying mock payment: Ref=${reference}`);

        // If the reference includes 'fail' or explicitly flagged in rawData, simulate failure
        if (reference.toLowerCase().includes("fail") || rawData.simulateFailure) {
            return {
                status: "failed",
                reference,
                transactionId: `mock_tx_${Date.now()}`,
                amount: rawData.amount || 0,
                currency: rawData.currency || "USD",
                reason: rawData.reason || "Simulated payment failure",
                raw: {
                    provider: "mock",
                    verified: false
                }
            };
        }

        return {
            status: "successful",
            reference,
            transactionId: `mock_tx_${Date.now()}`,
            amount: rawData.amount || 100.00,
            currency: rawData.currency || "USD",
            raw: {
                provider: "mock",
                verified: true,
                paidAt: new Date().toISOString()
            }
        };
    }

    async processRefund({ reference, providerTransactionId, amount, reason }) {
        console.log(`[MockPaymentProvider] Processing mock refund: Ref=${reference}, Amount=${amount}`);

        return {
            refundId: `mock_ref_${Date.now()}`,
            status: "completed",
            raw: {
                provider: "mock",
                reference,
                amount,
                reason: reason || "Customer request",
                refundedAt: new Date().toISOString()
            }
        };
    }

    async handleWebhook(payload, signature, headers = {}) {
        const data = typeof payload === "string" ? JSON.parse(payload) : payload;
        const event = data.event || "payment.success";
        const reference = data.reference || data.data?.reference || `mock_ref_${Date.now()}`;

        return {
            eventType: event,
            reference,
            status: event.includes("success") ? "successful" : "failed",
            data
        };
    }
}

export default MockPaymentProvider;
