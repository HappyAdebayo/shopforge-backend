import dotenv from "dotenv";
dotenv.config();

// Initialize DBs
import orderSequelize from "./src/config/db.js";
import Order from "./src/features/order/order.model.js";
import OrderItem from "./src/features/order/orderItem.model.js";
import ProductReplica from "./src/features/product/productReplica.model.js";
import OrderOutboxEvent from "./src/outbox-service/outbox.model.js";
import "./src/features/order/order.associations.js";
import orderService from "./src/features/order/order.service.js";

import paymentSequelize from "../payment-service/src/config/db.js";
import Payment from "../payment-service/src/features/payment/payment.model.js";
import Refund from "../payment-service/src/features/payment/refund.model.js";
import PaymentOutboxEvent from "../payment-service/src/outbox-service/outbox.model.js";
import "../payment-service/src/features/payment/payment.associations.js";
import paymentService from "../payment-service/src/features/payment/payment.service.js";
import paymentProviderFactory from "../payment-service/src/providers/paymentProvider.factory.js";

async function runEndToEndTests() {
    console.log("==================================================");
    console.log("STARTING ORDER SERVICE & PAYMENT SERVICE TESTS");
    console.log("==================================================");

    // 1. Sync Databases
    await orderSequelize.authenticate();
    await orderSequelize.sync({ force: true });
    console.log("✓ Order Service DB synced");

    await paymentSequelize.authenticate();
    await paymentSequelize.sync({ force: true });
    console.log("✓ Payment Service DB synced");

    // 2. Seed Product Catalog Replica in Order Service
    await ProductReplica.bulkCreate([
        {
            id: 201,
            name: "Pro Mechanical Keyboard",
            price: 120.00,
            stock: 15,
            status: "active",
            imageUrl: "https://example.com/keyboard.jpg"
        },
        {
            id: 202,
            name: "Ergonomic Gaming Mouse",
            price: 50.00,
            stock: 20,
            status: "active",
            imageUrl: "https://example.com/mouse.jpg"
        }
    ]);
    console.log("✓ Sample products seeded in Order Service replica");

    // 3. Test Provider Factory Architecture
    console.log("\n--- TEST 1: Payment Provider Factory (SOLID Architecture) ---");
    const providers = paymentProviderFactory.getSupportedProviders();
    console.log("Supported payment providers:", providers);
    if (!providers.includes("stripe") || !providers.includes("paystack") || !providers.includes("flutterwave") || !providers.includes("mock")) {
        throw new Error("Test 1 failed: Expected Stripe, Paystack, Flutterwave, and Mock providers");
    }

    const mockProvider = paymentProviderFactory.getProvider("mock");
    const stripeProvider = paymentProviderFactory.getProvider("stripe");
    const paystackProvider = paymentProviderFactory.getProvider("paystack");
    const flwProvider = paymentProviderFactory.getProvider("flutterwave");

    console.log(`Resolved providers: ${mockProvider.getName()}, ${stripeProvider.getName()}, ${paystackProvider.getName()}, ${flwProvider.getName()}`);
    console.log("✓ Test 1 Passed: Provider Factory resolved all implementations through PaymentProvider abstraction");

    // 4. Test Order Creation
    console.log("\n--- TEST 2: Order Creation & Total Calculations ---");
    const TEST_USER_ID = 88;
    const order = await orderService.createOrder(TEST_USER_ID, {
        customerEmail: "customer@example.com",
        customerName: "Bob Smith",
        currency: "USD",
        tax: 10.00,
        shippingFee: 5.00,
        shippingAddress: { street: "123 Main St", city: "Metropolis", country: "USA" },
        paymentProvider: "mock",
        items: [
            { productId: 201, quantity: 2 }, // 2x 120 = 240.00
            { productId: 202, quantity: 1 }  // 1x 50 = 50.00
        ]
    });

    console.log("Created Order:", order.orderNumber, "Status:", order.status);
    console.log("Subtotal:", order.subtotal, "Tax:", order.tax, "Shipping:", order.shippingFee, "Total:", order.totalAmount);
    console.log("Items count:", order.items.length);

    // Expected: Subtotal 290.00, Total: 305.00
    if (order.subtotal !== 290.00 || order.totalAmount !== 305.00 || order.status !== "pending") {
        throw new Error(`Test 2 failed: Expected subtotal 290.00 and total 305.00, got subtotal=${order.subtotal}, total=${order.totalAmount}`);
    }

    // Verify OrderCreated Outbox Event
    const orderOutbox = await OrderOutboxEvent.findAll({ where: { eventType: "OrderCreated" } });
    if (orderOutbox.length === 0) throw new Error("Test 2 failed: OrderCreated outbox event not found");
    const orderEventPayload = JSON.parse(orderOutbox[0].payload);
    console.log("OrderCreated Outbox Event recorded:", orderEventPayload.orderNumber, "Amount:", orderEventPayload.totalAmount);
    console.log("✓ Test 2 Passed: Order created with status 'pending' and totals calculated accurately");

    // 5. Test Payment Initialization
    console.log("\n--- TEST 3: Payment Initialization via Provider Abstraction ---");
    const paymentInit = await paymentService.initializePayment(TEST_USER_ID, {
        orderId: order.id,
        amount: order.totalAmount,
        currency: order.currency,
        customerEmail: order.customerEmail,
        provider: "mock",
        metadata: { orderNumber: order.orderNumber }
    });

    console.log("Payment Initialized:", paymentInit.reference, "Provider:", paymentInit.provider, "Checkout URL:", paymentInit.checkoutUrl);
    if (!paymentInit.reference || paymentInit.status !== "pending") {
        throw new Error("Test 3 failed: Payment initialization failed");
    }
    console.log("✓ Test 3 Passed: Payment initialized successfully");

    // 6. Test Successful Payment Verification & Order Confirmation Loop
    console.log("\n--- TEST 4: Payment Verification & Order Status Transition to 'confirmed' ---");
    const verifySuccess = await paymentService.verifyPayment(paymentInit.reference);
    console.log("Payment Verification Result:", verifySuccess.status, "Transaction ID:", verifySuccess.transactionId);
    if (verifySuccess.status !== "successful") throw new Error("Test 4 failed: Verification should be successful");

    // Verify PaymentSuccessful Outbox Event
    const paymentOutbox = await PaymentOutboxEvent.findAll({ where: { eventType: "PaymentSuccessful" } });
    if (paymentOutbox.length === 0) throw new Error("Test 4 failed: PaymentSuccessful outbox event not logged");
    const paymentSuccessPayload = JSON.parse(paymentOutbox[0].payload);

    // Simulate Order Service consuming PaymentSuccessful from RabbitMQ
    console.log("Simulating Order Service consuming 'PaymentSuccessful' event...");
    await orderService.handlePaymentSuccessful(paymentSuccessPayload);

    const confirmedOrder = await orderService.getOrder(order.id);
    console.log("Order Status after Payment Successful:", confirmedOrder.status);
    if (confirmedOrder.status !== "confirmed") {
        throw new Error(`Test 4 failed: Expected order status 'confirmed', got '${confirmedOrder.status}'`);
    }
    console.log("✓ Test 4 Passed: Order transitioned to 'confirmed' upon successful payment event");

    // 7. Test Payment Failure & Order Status Transition to 'payment_failed'
    console.log("\n--- TEST 5: Payment Failure & Order Status Transition to 'payment_failed' ---");
    const failedOrder = await orderService.createOrder(TEST_USER_ID, {
        customerEmail: "testfail@example.com",
        items: [{ productId: 202, quantity: 1 }],
        paymentProvider: "mock"
    });

    const failedPaymentInit = await paymentService.initializePayment(TEST_USER_ID, {
        orderId: failedOrder.id,
        amount: failedOrder.totalAmount,
        provider: "mock",
        customerEmail: "testfail@example.com"
    });

    // Verify with simulated failure
    const verifyFailure = await paymentService.verifyPayment(failedPaymentInit.reference, { simulateFailure: true, reason: "Insufficient card funds" });
    console.log("Payment Verification (Failure Simulation):", verifyFailure.status);
    if (verifyFailure.status !== "failed") throw new Error("Test 5 failed: Expected failed payment");

    const failedPaymentOutbox = await PaymentOutboxEvent.findAll({ where: { eventType: "PaymentFailed" } });
    const paymentFailedPayload = JSON.parse(failedPaymentOutbox[0].payload);

    // Simulate Order Service consuming PaymentFailed from RabbitMQ
    await orderService.handlePaymentFailed(paymentFailedPayload);

    const updatedFailedOrder = await orderService.getOrder(failedOrder.id);
    console.log("Order Status after Payment Failed:", updatedFailedOrder.status, "Notes:", updatedFailedOrder.notes);
    if (updatedFailedOrder.status !== "payment_failed") {
        throw new Error(`Test 5 failed: Expected status 'payment_failed', got '${updatedFailedOrder.status}'`);
    }
    console.log("✓ Test 5 Passed: Order transitioned to 'payment_failed' upon failed payment event");

    // 8. Test Refund Processing
    console.log("\n--- TEST 6: Payment Refund Processing ---");
    const refund = await paymentService.processRefund(paymentInit.reference, {
        amount: 305.00,
        reason: "Customer requested return"
    });
    console.log("Refund processed:", refund.reference, "Status:", refund.status, "Amount:", refund.amount);
    if (refund.status !== "completed") throw new Error("Test 6 failed: Refund was not completed");
    console.log("✓ Test 6 Passed: Refund processed and recorded cleanly");

    console.log("\n==================================================");
    console.log("ALL ORDER & PAYMENT SERVICE TESTS PASSED! ✓");
    console.log("==================================================");
}

runEndToEndTests().catch(err => {
    console.error("TEST FAILED:", err);
    process.exit(1);
});
