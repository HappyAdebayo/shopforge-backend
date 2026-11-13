import dotenv from "dotenv";
dotenv.config();

import sequelize from "./src/config/db.js";
import Payment from "./src/features/payment/payment.model.js";
import Refund from "./src/features/payment/refund.model.js";
import OutboxEvent from "./src/outbox-service/outbox.model.js";
import "./src/features/payment/payment.associations.js";
import paymentService from "./src/features/payment/payment.service.js";
import paymentProviderFactory from "./src/providers/paymentProvider.factory.js";

async function runTests() {
    console.log("====================================");
    console.log(" PAYMENT SERVICE INTEGRATION TESTS  ");
    console.log("====================================");

    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log("✓ Database synced");

    // TEST 1: Provider factory resolves all built-in providers
    console.log("\n--- TEST 1: Provider Factory Architecture ---");
    const providers = paymentProviderFactory.getSupportedProviders();
    console.log("Registered providers:", providers);
    if (!["mock", "stripe", "paystack", "flutterwave"].every(p => providers.includes(p))) {
        throw new Error("Not all providers registered");
    }
    const mock = paymentProviderFactory.getProvider("mock");
    const stripe = paymentProviderFactory.getProvider("stripe");
    const paystack = paymentProviderFactory.getProvider("paystack");
    const flw = paymentProviderFactory.getProvider("flutterwave");
    console.log(`Provider names: ${mock.getName()}, ${stripe.getName()}, ${paystack.getName()}, ${flw.getName()}`);
    console.log("✓ Test 1 Passed: Factory resolves all providers via abstraction");

    // TEST 2: Initialize payment
    console.log("\n--- TEST 2: Initialize Payment (Mock Provider) ---");
    const initResult = await paymentService.initializePayment(42, {
        orderId: 100,
        amount: 305.00,
        currency: "USD",
        customerEmail: "customer@shopforge.com",
        provider: "mock"
    });
    console.log("Reference:", initResult.reference, "| Provider:", initResult.provider, "| Status:", initResult.status);
    console.log("Checkout URL:", initResult.checkoutUrl);
    if (!initResult.reference || initResult.status !== "pending") throw new Error("Initialize failed");
    const paymentInDb = await Payment.findOne({ where: { reference: initResult.reference } });
    if (!paymentInDb) throw new Error("Payment not saved to DB");
    console.log("✓ Test 2 Passed: Payment initialized and persisted");

    // TEST 3: PaymentInitialized outbox event
    console.log("\n--- TEST 3: PaymentInitialized Outbox Event ---");
    const initOutbox = await OutboxEvent.findAll({ where: { eventType: "PaymentInitialized" } });
    if (initOutbox.length === 0) throw new Error("No PaymentInitialized outbox event");
    const initPayload = JSON.parse(initOutbox[0].payload);
    console.log("Outbox payload - ref:", initPayload.reference, "amount:", initPayload.amount);
    console.log("✓ Test 3 Passed");

    // TEST 4: Verify successful payment
    console.log("\n--- TEST 4: Verify Successful Payment -> PaymentSuccessful Event ---");
    const verifyResult = await paymentService.verifyPayment(initResult.reference);
    console.log("Verify status:", verifyResult.status, "| TxID:", verifyResult.transactionId);
    if (verifyResult.status !== "successful") throw new Error("Verify should succeed");
    const successOutbox = await OutboxEvent.findAll({ where: { eventType: "PaymentSuccessful" } });
    if (successOutbox.length === 0) throw new Error("No PaymentSuccessful outbox event");
    const successPayload = JSON.parse(successOutbox[0].payload);
    console.log("PaymentSuccessful outbox - orderId:", successPayload.orderId, "amount:", successPayload.amount);
    console.log("✓ Test 4 Passed");

    // TEST 5: Re-verify already-successful payment (idempotency)
    console.log("\n--- TEST 5: Re-verify already successful payment (idempotency) ---");
    const reVerify = await paymentService.verifyPayment(initResult.reference);
    console.log("Re-verify result - already processed:", reVerify.alreadyProcessed);
    if (!reVerify.alreadyProcessed) throw new Error("Should have returned alreadyProcessed=true");
    console.log("✓ Test 5 Passed");

    // TEST 6: Simulate payment failure
    console.log("\n--- TEST 6: Simulate Payment Failure -> PaymentFailed Event ---");
    const failInit = await paymentService.initializePayment(42, {
        orderId: 101,
        amount: 50.00,
        provider: "mock",
        customerEmail: "fail@example.com"
    });
    const failVerify = await paymentService.verifyPayment(failInit.reference, { simulateFailure: true, reason: "Card declined" });
    console.log("Failure verify status:", failVerify.status);
    if (failVerify.status !== "failed") throw new Error("Expected failed status");
    const failOutbox = await OutboxEvent.findAll({ where: { eventType: "PaymentFailed" } });
    if (failOutbox.length === 0) throw new Error("No PaymentFailed outbox event");
    console.log("PaymentFailed outbox recorded:", JSON.parse(failOutbox[0].payload).reason);
    console.log("✓ Test 6 Passed");

    // TEST 7: Refund processing
    console.log("\n--- TEST 7: Refund Processing ---");
    const refund = await paymentService.processRefund(initResult.reference, {
        amount: 50.00,
        reason: "Partial refund - item out of stock"
    });
    console.log("Refund:", refund.reference, "| Status:", refund.status, "| Amount:", refund.amount);
    if (refund.status !== "completed") throw new Error("Refund should be completed");
    const refundOutbox = await OutboxEvent.findAll({ where: { eventType: "PaymentRefunded" } });
    if (refundOutbox.length === 0) throw new Error("No PaymentRefunded outbox event");
    console.log("✓ Test 7 Passed");

    // TEST 8: Get payment by reference
    console.log("\n--- TEST 8: Get Payment by Reference ---");
    const fetchedPayment = await paymentService.getPaymentByReference(initResult.reference);
    console.log("Fetched payment status:", fetchedPayment.status, "| refunds count:", fetchedPayment.refunds?.length);
    if (!fetchedPayment) throw new Error("Could not fetch payment");
    console.log("✓ Test 8 Passed");

    // TEST 9: Get payment by orderId
    console.log("\n--- TEST 9: Get Payment by Order ID ---");
    const byOrder = await paymentService.getPaymentByOrderId(100);
    console.log("Payment by orderId 100 - ref:", byOrder.reference);
    if (!byOrder) throw new Error("Could not fetch payment by orderId");
    console.log("✓ Test 9 Passed");

    console.log("\n====================================");
    console.log(" ALL PAYMENT SERVICE TESTS PASSED ✓ ");
    console.log("====================================");
}

runTests().catch(err => {
    console.error("\nTEST FAILED:", err.message);
    process.exit(1);
});
