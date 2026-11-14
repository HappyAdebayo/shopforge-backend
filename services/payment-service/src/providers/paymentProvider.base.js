/**
 * Abstract base class for all Payment Providers (SOLID Interface / Dependency Inversion).
 * All concrete providers (Stripe, Paystack, Flutterwave, Mock, etc.) must implement this contract.
 */
export class PaymentProvider {

    /**
     * Unique identifier for the provider (e.g. 'stripe', 'paystack', 'flutterwave', 'mock')
     * @returns {string}
     */
    getName() {
        throw new Error("getName() must be implemented by concrete PaymentProvider subclass");
    }

    /**
     * Initializes a transaction with the payment gateway.
     * @param {Object} params
     * @param {number} params.amount - Total amount to charge
     * @param {string} params.currency - 3-letter currency code (e.g., 'USD', 'NGN')
     * @param {string} params.email - Customer email
     * @param {string} params.reference - Unique transaction reference ID
     * @param {Object} [params.metadata] - Additional metadata (e.g. orderId, userId)
     * @param {string} [params.callbackUrl] - Return URL after checkout
     * @returns {Promise<{ reference: string, checkoutUrl: string, accessCode?: string, raw?: any }>}
     */
    async initializePayment(params) {
        throw new Error("initializePayment() must be implemented by concrete PaymentProvider subclass");
    }

    /**
     * Verifies payment status with the gateway.
     * @param {string} reference - The unique reference of the transaction
     * @param {Object} [rawData] - Optional payload/data from redirect or webhook
     * @returns {Promise<{ status: 'successful' | 'failed' | 'pending', reference: string, transactionId?: string, amount?: number, currency?: string, raw?: any }>}
     */
    async verifyPayment(reference, rawData = {}) {
        throw new Error("verifyPayment() must be implemented by concrete PaymentProvider subclass");
    }

    /**
     * Processes a full or partial refund.
     * @param {Object} params
     * @param {string} params.reference - Transaction reference
     * @param {string} [params.providerTransactionId] - Gateway charge/payment ID
     * @param {number} params.amount - Refund amount
     * @param {string} [params.reason] - Reason for refund
     * @returns {Promise<{ refundId: string, status: 'completed' | 'pending' | 'failed', raw?: any }>}
     */
    async processRefund(params) {
        throw new Error("processRefund() must be implemented by concrete PaymentProvider subclass");
    }

    /**
     * Handles and parses webhook callbacks from the payment gateway.
     * @param {Object|string} payload - Raw or parsed webhook body
     * @param {string} signature - Webhook signature header
     * @param {Object} [headers] - Request headers
     * @returns {Promise<{ eventType: string, reference: string, status: 'successful' | 'failed' | 'pending' | 'refunded', data?: any }>}
     */
    async handleWebhook(payload, signature, headers = {}) {
        throw new Error("handleWebhook() must be implemented by concrete PaymentProvider subclass");
    }
}

export default PaymentProvider;
