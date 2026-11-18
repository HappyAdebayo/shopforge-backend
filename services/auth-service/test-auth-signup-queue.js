import dotenv from "dotenv";
dotenv.config();

import sequelize from "./src/config/db.js";
import OutboxEvent from "./src/outbox-service/outbox.model.js";
import authService from "./src/features/auth/auth.service.js";

async function testAuthSignup() {
    console.log("==================================================");
    console.log("STARTING AUTH SERVICE SIGNUP & OUTBOX TESTS");
    console.log("==================================================");

    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log("✓ Database synced");

    const testUserEmail = `test_${Date.now()}@example.com`;
    console.log(`\n--- Signing up user: ${testUserEmail} ---`);

    const result = await authService.signup({
        name: "Alice Developer",
        email: testUserEmail,
        password: "Password123!"
    });

    console.log("User created:", result.user.id, result.user.email);

    // Verify Outbox Event was created in transaction
    const outboxEvents = await OutboxEvent.findAll({
        where: {
            eventType: "UserSignedUp"
        }
    });

    console.log("Found UserSignedUp outbox events:", outboxEvents.length);
    if (outboxEvents.length === 0) {
        throw new Error("No UserSignedUp event found in outbox table");
    }

    const payload = JSON.parse(outboxEvents[0].payload);
    console.log("Outbox event payload:", payload);

    if (payload.email !== testUserEmail || payload.name !== "Alice Developer") {
        throw new Error("Payload mismatch in outbox event");
    }

    console.log("✓ Test Passed: Signup creates user and transactional UserSignedUp outbox event for email worker queue");
    console.log("==================================================");
}

testAuthSignup().catch(err => {
    console.error("TEST FAILED:", err);
    process.exit(1);
});
