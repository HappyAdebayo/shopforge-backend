import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import sequelize from "./src/config/db.js";
import "./src/features/auth/auth.model.js";
import "./src/outbox-service/outbox.model.js";
import User from "./src/features/auth/auth.model.js";

import { connectRabbitMQ, publishEvent } from "./src/config/rabbitmq.js";
import vendorApplicationSubmitted from "./src/events/consumers/vendorApplicationSubmitted.js";
import vendorApplicationRejected from "./src/events/consumers/vendorApplicationRejected.js";
import vendorApplicationApproved from "./src/events/consumers/vendorApplicationApproved.js";
import userSignupEmailConsumer from "./src/events/consumers/userSignupEmail.consumer.js";
import processOutboxEvents from "./src/outbox-service/outbox.worker.js";

const PORT = process.env.PORT || 3001;

/**
 * Publish AdminUserSynced so that notification-service can seed its
 * admin_users_replica table with real data from the auth DB.
 */
const syncAdminUsersToRabbitMQ = async () => {
    try {
        const { Op } = await import("sequelize");
        const admins = await User.findAll({
            where: { role: { [Op.in]: ["admin", "superadmin"] } },
            attributes: ["id", "name", "email", "role"]
        });

        if (admins.length === 0) {
            console.warn("[Auth Startup] No admin users found to sync.");
            return;
        }

        await publishEvent("AdminUserSynced", {
            admins: admins.map((a) => ({ id: a.id, name: a.name, email: a.email, role: a.role }))
        });

        console.log(`[Auth Startup] Published AdminUserSynced with ${admins.length} admin(s).`);
    } catch (err) {
        console.warn("[Auth Startup] Could not publish AdminUserSynced:", err.message);
    }
};

const startServer = async () => {
    try {
        await sequelize.authenticate();

        console.log("Database connected");

        await sequelize.sync();

        console.log("Database synchronized");

        const channel = await connectRabbitMQ();

        // Seed notification-service admin replica via RabbitMQ
        await syncAdminUsersToRabbitMQ();

        // Register consumers
        await vendorApplicationSubmitted(channel);
        await vendorApplicationApproved(channel);
        await vendorApplicationRejected(channel);
        await userSignupEmailConsumer(channel);

        // Start Outbox Worker Loop
        setInterval(
            processOutboxEvents,
            3000
        );
        processOutboxEvents();

        app.listen(PORT, () => {
            console.log(`Auth service running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Failed to start auth service:", error);
    }
};

startServer();