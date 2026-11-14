import dotenv from "dotenv";
dotenv.config();

import sequelize from "./src/config/db.js";
import Order from "./src/features/order/order.model.js";
import OrderItem from "./src/features/order/orderItem.model.js";
import ProductReplica from "./src/features/product/productReplica.model.js";
import OutboxEvent from "./src/outbox-service/outbox.model.js";
import "./src/features/order/order.associations.js";
import orderService from "./src/features/order/order.service.js";

async function runTests() {
    console.log("====================================");
    console.log("  ORDER SERVICE INTEGRATION TESTS   ");
    console.log("====================================");

    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log("✓ Database synced (in-memory)");

    // Seed Product Replicas
    await ProductReplica.bulkCreate([
        { id: 201, name: "Pro Keyboard", price: 120.00, stock: 10, status: "active" },
        { id: 202, name: "Gaming Mouse",  price: 50.00, stock: 20, status: "active" }
    ]);
    console.log("✓ Products seeded in replica");

    // TEST 1: Create Order
    console.log("\n--- TEST 1: Create Order ---");
    const order = await orderService.createOrder(1, {
        customerEmail: "test@example.com",
        customerName: "Test User",
        currency: "USD",
        tax: 10.00,
        shippingFee: 5.00,
        paymentProvider: "mock",
        items: [
            { productId: 201, quantity: 2 },
            { productId: 202, quantity: 1 }
        ]
    });

    console.log("Order:", order.orderNumber, "| Status:", order.status);
    console.log("Subtotal:", order.subtotal, "| Tax:", order.tax, "| Shipping:", order.shippingFee, "| Total:", order.totalAmount);
    console.log("Items:", order.items.length);

    if (order.status !== "pending") throw new Error("Order should be 'pending'");
    if (order.subtotal !== 290.00) throw new Error(`Expected subtotal 290.00, got ${order.subtotal}`);
    if (order.totalAmount !== 305.00) throw new Error(`Expected total 305.00, got ${order.totalAmount}`);
    if (order.items.length !== 2) throw new Error("Expected 2 order items");
    console.log("✓ Test 1 Passed");

    // TEST 2: OrderCreated Outbox Event
    console.log("\n--- TEST 2: OrderCreated Outbox Event ---");
    const outboxEvents = await OutboxEvent.findAll({ where: { eventType: "OrderCreated" } });
    if (outboxEvents.length === 0) throw new Error("No OrderCreated outbox event found");
    const payload = JSON.parse(outboxEvents[0].payload);
    console.log("Event payload orderNumber:", payload.orderNumber, "Total:", payload.totalAmount);
    if (payload.totalAmount !== 305.00) throw new Error("Outbox payload total is wrong");
    console.log("✓ Test 2 Passed");

    // TEST 3: Get Order by ID
    console.log("\n--- TEST 3: Get Order by ID ---");
    const fetched = await orderService.getOrder(order.id);
    if (fetched.orderNumber !== order.orderNumber) throw new Error("Mismatch order number");
    console.log("Fetched:", fetched.orderNumber, "| Status:", fetched.status);
    console.log("✓ Test 3 Passed");

    // TEST 4: Handle PaymentSuccessful (status -> confirmed)
    console.log("\n--- TEST 4: handlePaymentSuccessful -> confirmed ---");
    await orderService.handlePaymentSuccessful({ orderId: order.id, amount: 305.00, reference: "PAY-TESTREF" });
    const confirmedOrder = await orderService.getOrder(order.id);
    console.log("Order status after PaymentSuccessful:", confirmedOrder.status);
    if (confirmedOrder.status !== "confirmed") throw new Error("Expected status 'confirmed'");
    console.log("✓ Test 4 Passed");

    // TEST 5: Create another order and simulate PaymentFailed
    console.log("\n--- TEST 5: handlePaymentFailed -> payment_failed ---");
    const order2 = await orderService.createOrder(2, {
        customerEmail: "fail@example.com",
        paymentProvider: "mock",
        items: [{ productId: 202, quantity: 1 }]
    });
    await orderService.handlePaymentFailed({ orderId: order2.id, reason: "Card declined", reference: "PAY-FAILREF" });
    const failedOrder = await orderService.getOrder(order2.id);
    console.log("Order status after PaymentFailed:", failedOrder.status);
    if (failedOrder.status !== "payment_failed") throw new Error("Expected status 'payment_failed'");
    console.log("✓ Test 5 Passed");

    // TEST 6: Cancel order
    console.log("\n--- TEST 6: Cancel Order ---");
    const order3 = await orderService.createOrder(3, {
        customerEmail: "cancel@example.com",
        paymentProvider: "mock",
        items: [{ productId: 201, quantity: 1 }]
    });
    const cancelled = await orderService.cancelOrder(order3.id, 3, "Changed my mind");
    console.log("Cancelled Order Status:", cancelled.status);
    if (cancelled.status !== "cancelled") throw new Error("Expected status 'cancelled'");
    console.log("✓ Test 6 Passed");

    // TEST 7: Out-of-stock validation
    console.log("\n--- TEST 7: Stock validation ---");
    try {
        await orderService.createOrder(1, {
            items: [{ productId: 202, quantity: 9999 }]
        });
        throw new Error("Should have thrown stock error");
    } catch (err) {
        if (!err.message.includes("Insufficient stock")) throw err;
        console.log("Stock error thrown correctly:", err.message);
    }
    console.log("✓ Test 7 Passed");

    console.log("\n====================================");
    console.log("  ALL ORDER SERVICE TESTS PASSED ✓  ");
    console.log("====================================");
}

runTests().catch(err => {
    console.error("\nTEST FAILED:", err.message);
    process.exit(1);
});
