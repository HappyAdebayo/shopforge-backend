import dotenv from "dotenv";
dotenv.config();

import sequelize from "./src/config/db.js";
import Cart from "./src/features/cart/cart.model.js";
import CartItem from "./src/features/cart/cartItem.model.js";
import ProductReplica from "./src/features/product/productReplica.model.js";
import OutboxEvent from "./src/outbox-service/outbox.model.js";
import "./src/features/cart/cart.associations.js";
import cartService from "./src/features/cart/cart.service.js";

async function runTests() {
    console.log("==================================================");
    console.log("STARTING CART SERVICE TESTS");
    console.log("==================================================");

    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log("✓ Database synced");

    // 1. Seed Product Replicas (simulating synced RabbitMQ events)
    await ProductReplica.bulkCreate([
        {
            id: 101,
            name: "Wireless Noise-Canceling Headphones",
            price: 199.99,
            stock: 10,
            status: "active",
            imageUrl: "https://example.com/headphones.jpg"
        },
        {
            id: 102,
            name: "Mechanical Gaming Keyboard",
            price: 89.50,
            stock: 5,
            status: "active",
            imageUrl: "https://example.com/keyboard.jpg"
        },
        {
            id: 103,
            name: "Limited Edition Smart Watch",
            price: 299.00,
            stock: 1,
            status: "active",
            imageUrl: "https://example.com/watch.jpg"
        },
        {
            id: 104,
            name: "Discontinued USB Hub",
            price: 25.00,
            stock: 0,
            status: "inactive",
            imageUrl: "https://example.com/hub.jpg"
        }
    ]);
    console.log("✓ Sample products created in ProductReplica table");

    const TEST_USER_ID = 42;

    // Test 1: Creating / Getting user cart (empty initial state)
    console.log("\n--- TEST 1: Get Initial User Cart ---");
    let cart = await cartService.getCart(TEST_USER_ID);
    console.log("Cart ID:", cart.id, "User ID:", cart.userId, "Items count:", cart.items.length, "Subtotal:", cart.subtotal);
    if (cart.items.length !== 0 || cart.subtotal !== 0) throw new Error("Test 1 failed: Expected empty cart");
    console.log("✓ Test 1 Passed: Empty cart created & retrieved successfully");

    // Test 2: Adding products to cart
    console.log("\n--- TEST 2: Adding Products to Cart ---");
    cart = await cartService.addItem(TEST_USER_ID, { productId: 101, quantity: 2 });
    console.log("Added 2x Headphones ($199.99 each). Cart items:", cart.items.length, "Subtotal:", cart.subtotal);
    if (cart.subtotal !== 399.98) throw new Error(`Test 2 failed: Expected subtotal 399.98, got ${cart.subtotal}`);

    cart = await cartService.addItem(TEST_USER_ID, { productId: 102, quantity: 1 });
    console.log("Added 1x Keyboard ($89.50). Cart items:", cart.items.length, "Subtotal:", cart.subtotal);
    // 399.98 + 89.50 = 489.48
    if (cart.subtotal !== 489.48) throw new Error(`Test 2 failed: Expected subtotal 489.48, got ${cart.subtotal}`);
    console.log("✓ Test 2 Passed: Products added and subtotal calculated accurately");

    // Test 3: Adding duplicate product increments quantity
    console.log("\n--- TEST 3: Adding Duplicate Product Increments Quantity ---");
    cart = await cartService.addItem(TEST_USER_ID, { productId: 102, quantity: 2 });
    const keyboardItem = cart.items.find(i => i.productId === 102);
    console.log("Keyboard quantity now:", keyboardItem.quantity, "Subtotal:", cart.subtotal);
    // 2x 199.99 + 3x 89.50 = 399.98 + 268.50 = 668.48
    if (keyboardItem.quantity !== 3 || cart.subtotal !== 668.48) throw new Error(`Test 3 failed: Expected qty 3 and subtotal 668.48, got qty ${keyboardItem.quantity}, subtotal ${cart.subtotal}`);
    console.log("✓ Test 3 Passed: Duplicate product addition correctly increments quantity");

    // Test 4: Updating quantities
    console.log("\n--- TEST 4: Updating Quantities ---");
    cart = await cartService.updateQuantity(TEST_USER_ID, keyboardItem.id, 1);
    const updatedKeyboardItem = cart.items.find(i => i.productId === 102);
    console.log("Updated keyboard quantity to 1. Subtotal:", cart.subtotal);
    // 2x 199.99 + 1x 89.50 = 489.48
    if (updatedKeyboardItem.quantity !== 1 || cart.subtotal !== 489.48) throw new Error(`Test 4 failed: Expected subtotal 489.48, got ${cart.subtotal}`);
    console.log("✓ Test 4 Passed: Quantity updated successfully");

    // Test 5: Validation - Stock and Availability Checks
    console.log("\n--- TEST 5: Cart Validation & Availability Checks ---");
    let validation = await cartService.validateCart(TEST_USER_ID);
    console.log("Validation Result (all valid):", validation.isValid, "Issues:", validation.issues.length);
    if (!validation.isValid) throw new Error("Test 5 failed: Expected valid cart");

    // Now simulate stock decrease and inactive product
    const headphones = await ProductReplica.findByPk(101);
    headphones.stock = 1; // Cart has 2, but only 1 left in stock!
    headphones.price = 229.99; // Price changed
    await headphones.save();

    validation = await cartService.validateCart(TEST_USER_ID);
    console.log("Validation Result after stock decrease & price change:", validation.isValid);
    console.log("Detected Issues:", validation.issues);
    if (validation.isValid || validation.issues.length < 2) {
        throw new Error("Test 5 failed: Expected validation issues for insufficient stock and price change");
    }
    console.log("✓ Test 5 Passed: Product availability, stock constraints, and price changes detected");

    // Test 6: Removing products
    console.log("\n--- TEST 6: Removing Product from Cart ---");
    cart = await cartService.removeItem(TEST_USER_ID, 102); // remove keyboard by productId
    console.log("Removed keyboard. Remaining items in cart:", cart.items.length, "Subtotal:", cart.subtotal);
    if (cart.items.length !== 1 || cart.items[0].productId !== 101) throw new Error("Test 6 failed: Keyboard was not removed");
    console.log("✓ Test 6 Passed: Product removed cleanly");

    // Test 7: Clearing cart
    console.log("\n--- TEST 7: Clearing Cart ---");
    const clearResult = await cartService.clearCart(TEST_USER_ID);
    console.log("Cart cleared. Items:", clearResult.items.length, "Subtotal:", clearResult.subtotal);
    if (clearResult.items.length !== 0 || clearResult.subtotal !== 0) throw new Error("Test 7 failed: Cart was not cleared");
    console.log("✓ Test 7 Passed: Cart cleared successfully");

    // Test 8: Verify Outbox Events
    console.log("\n--- TEST 8: Verifying Outbox Events Recorded ---");
    const outboxEvents = await OutboxEvent.findAll();
    console.log("Total outbox events recorded in cart-service:", outboxEvents.length);
    const eventTypes = outboxEvents.map(e => e.eventType);
    console.log("Event types logged:", eventTypes);
    if (!eventTypes.includes("CartCreated") || !eventTypes.includes("CartItemAdded") || !eventTypes.includes("CartCleared")) {
        throw new Error("Test 8 failed: Outbox events missing");
    }
    console.log("✓ Test 8 Passed: Outbox pattern recorded events reliably in transactions");

    console.log("\n==================================================");
    console.log("ALL CART SERVICE TESTS PASSED SUCCESSFULLY! ✓");
    console.log("==================================================");
}

runTests().catch(err => {
    console.error("TEST FAILED:", err);
    process.exit(1);
});
