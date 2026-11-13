import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import sequelize from "./src/config/db.js";

import "./src/features/payment/payment.model.js";
import "./src/features/payment/refund.model.js";
import "./src/features/payment/payment.associations.js";
import "./src/outbox-service/outbox.model.js";

import { connectRabbitMQ } from "./src/config/rabbitmq.js";
import orderEventsConsumer from "./src/events/consumers/orderEvents.consumer.js";
import processOutboxEvents from "./src/outbox-service/outbox.worker.js";

const PORT = process.env.PORT || 3008;

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log("[Payment Service] Database connected");

        await sequelize.sync();
        console.log("[Payment Service] Database synchronized");

        // Connect RabbitMQ
        const channel = await connectRabbitMQ();

        // Register event consumers
        await orderEventsConsumer(channel);

        // Start Outbox Worker loop
        setInterval(
            processOutboxEvents,
            3000
        );
        processOutboxEvents();

        app.listen(PORT, () => {
            console.log(`[Payment Service] Running on port ${PORT}`);
        });

    } catch (error) {
        console.error("[Payment Service] Failed to start payment service:", error);
    }
};

startServer();
