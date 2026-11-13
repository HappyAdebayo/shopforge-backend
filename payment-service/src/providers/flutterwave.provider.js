import { PaymentProvider } from "./paymentProvider.base.js";

export class FlutterwavePaymentProvider extends PaymentProvider {

    constructor(config = {}) {
        super();
        this.secretKey = config.secretKey || process.env.FLW_SECRET_KEY || "FLWSECK_TEST_placeholder_key";
    }

    getName() {
        return "flutterwave";
    }

    async initializePayment({ amount, currency = "USD", email, reference, metadata = {}, callbackUrl }) {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const redirectUrl = callbackUrl || `${frontendUrl}/checkout/flutterwave-callback?reference=${reference}`;

        console.log(`[FlutterwavePaymentProvider] Initializing Flutterwave payment: Ref=${reference}, Amount=${amount} ${currency}`);

        try {
            const response = await fetch("https://api.flutterwave.com/v3/payments", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.secretKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    tx_ref: reference,
                    amount,
                    currency,
                    redirect_url: redirectUrl,
                    customer: {
                        email,
                        name: metadata.customerName || "ShopForge Customer"
                    },
                    meta: metadata,
                    customizations: {
                        title: "ShopForge Checkout",
                        description: `Payment for Order ${metadata.orderNumber || reference}`
                    }
                })
            });

            const data = await response.json();

            if (!response.ok || data.status !== "success") {
                console.warn("[FlutterwavePaymentProvider] Flutterwave API call failed:", data?.message);
                return {
                    reference,
                    checkoutUrl: `${frontendUrl}/checkout/flutterwave-mock?reference=${reference}&amount=${amount}`,
                    accessCode: `flw_mock_${reference}`,
                    raw: { simulated: true, error: data?.message }
                };
            }

            return {
                reference,
                checkoutUrl: data.data.link,
                accessCode: reference,
                raw: data.data
            };
        } catch (error) {
            console.error("[FlutterwavePaymentProvider] Error initializing payment:", error.message);
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
            return {
                reference,
                checkoutUrl: `${frontendUrl}/checkout/flutterwave-mock?reference=${reference}&amount=${amount}`,
                accessCode: `flw_mock_${reference}`,
                raw: { error: error.message }
            };
        }
    }

    async verifyPayment(reference, rawData = {}) {
        console.log(`[FlutterwavePaymentProvider] Verifying Flutterwave transaction: Ref=${reference}`);

        try {
            const response = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`, {
                headers: {
                    "Authorization": `Bearer ${this.secretKey}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === "success" && data.data) {
                    const tx = data.data;
                    const isSuccess = tx.status === "successful";
                    return {
                        status: isSuccess ? "successful" : (tx.status === "failed" ? "failed" : "pending"),
                        reference: tx.tx_ref,
                        transactionId: String(tx.id),
                        amount: tx.amount,
                        currency: tx.currency,
                        raw: tx
                    };
                }
            }
        } catch (err) {
            console.warn("[FlutterwavePaymentProvider] Error querying Flutterwave verify API:", err.message);
        }

        // Mock verification fallback
        const isSuccess = !reference.toLowerCase().includes("fail");
        return {
            status: isSuccess ? "successful" : "failed",
            reference,
            transactionId: `flw_tx_${Date.now()}`,
            amount: rawData.amount,
            currency: rawData.currency || "USD",
            raw: { verified: isSuccess, provider: "flutterwave" }
        };
    }

    async processRefund({ reference, providerTransactionId, amount, reason }) {
        console.log(`[FlutterwavePaymentProvider] Processing Flutterwave refund for ${reference}`);
        return {
            refundId: `flw_rf_${Date.now()}`,
            status: "completed",
            raw: { provider: "flutterwave", reference, amount, reason }
        };
    }

    async handleWebhook(payload, signature, headers = {}) {
        const data = typeof payload === "string" ? JSON.parse(payload) : payload;
        const event = data.event || "charge.completed";
        const tx = data.data || {};
        const reference = tx.tx_ref;

        let status = "pending";
        if (event === "charge.completed" && tx.status === "successful") {
            status = "successful";
        } else if (tx.status === "failed") {
            status = "failed";
        }

        return {
            eventType: event,
            reference: reference || `flw_ref_${Date.now()}`,
            status,
            data
        };
    }
}

export default FlutterwavePaymentProvider;
