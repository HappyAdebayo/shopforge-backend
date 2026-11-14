import MockPaymentProvider from "./mock.provider.js";
import StripePaymentProvider from "./stripe.provider.js";
import PaystackPaymentProvider from "./paystack.provider.js";
import FlutterwavePaymentProvider from "./flutterwave.provider.js";
import { PaymentProvider } from "./paymentProvider.base.js";

class PaymentProviderFactory {

    constructor() {
        /** @type {Map<string, PaymentProvider>} */
        this.providers = new Map();

        // Register default built-in providers
        this.registerProvider("mock", new MockPaymentProvider());
        this.registerProvider("stripe", new StripePaymentProvider());
        this.registerProvider("paystack", new PaystackPaymentProvider());
        this.registerProvider("flutterwave", new FlutterwavePaymentProvider());
    }

    /**
     * Registers a new payment provider without modifying existing logic (Open/Closed Principle).
     * @param {string} name - Provider identifier
     * @param {PaymentProvider} providerInstance - Instance implementing PaymentProvider
     */
    registerProvider(name, providerInstance) {
        if (!(providerInstance instanceof PaymentProvider)) {
            throw new Error(`Provider "${name}" must extend PaymentProvider base class`);
        }
        this.providers.set(name.toLowerCase(), providerInstance);
        console.log(`[PaymentProviderFactory] Registered provider: "${name}"`);
    }

    /**
     * Resolves a provider instance by name.
     * @param {string} [name] - Provider name (defaults to DEFAULT_PAYMENT_PROVIDER env or "mock")
     * @returns {PaymentProvider}
     */
    getProvider(name) {
        const defaultProviderName = process.env.DEFAULT_PAYMENT_PROVIDER || "mock";
        const targetName = (name || defaultProviderName).toLowerCase();

        const provider = this.providers.get(targetName);

        if (!provider) {
            console.warn(`[PaymentProviderFactory] Provider "${targetName}" not found. Falling back to default.`);
            const fallback = this.providers.get("mock");
            if (!fallback) {
                throw new Error(`No available payment provider found for "${targetName}"`);
            }
            return fallback;
        }

        return provider;
    }

    /**
     * Lists all registered provider names.
     * @returns {string[]}
     */
    getSupportedProviders() {
        return Array.from(this.providers.keys());
    }
}

// Singleton factory instance
const paymentProviderFactory = new PaymentProviderFactory();

export default paymentProviderFactory;
export { paymentProviderFactory };
