import env from "./src/config/env.js";
import logger from "./src/config/logger.js";
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

const PORT = env.PORT;

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
            logger.warn("No admin users found to sync");
            return;
        }

        await publishEvent("AdminUserSynced", {
            admins: admins.map((a) => ({ id: a.id, name: a.name, email: a.email, role: a.role }))
        });

        logger.info(`Published AdminUserSynced with ${admins.length} admin(s)`)
    }  catch (err) {
        logger.warn({ err }, "Could not publish AdminUserSynced");
    }
};

const startServer = async () => {
    try {
        await sequelize.authenticate();

        logger.info("Database connected");

        await sequelize.sync();

        logger.info("Database synchronized");

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
            logger.info(`Auth service is running on port ${PORT}`);
        });

    } catch (error) {
        logger.error({ err: error }, "Failed to start auth service");
    }
};

startServer();