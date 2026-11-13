import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import sequelize from "./src/config/db.js";

import "./src/features/order/order.model.js";
import "./src/features/order/orderItem.model.js";
import "./src/features/product/productReplica.model.js";
import "./src/features/order/order.associations.js";
import "./src/outbox-service/outbox.model.js";

import { connectRabbitMQ } from "./src/config/rabbitmq.js";
import productEventsConsumer from "./src/events/consumers/productEvents.consumer.js";
import paymentEventsConsumer from "./src/events/consumers/paymentEvents.consumer.js";
import processOutboxEvents from "./src/outbox-service/outbox.worker.js";

const PORT = process.env.PORT || 3007;

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log("[Order Service] Database connected");

        await sequelize.sync();
        console.log("[Order Service] Database synchronized");

        // Connect RabbitMQ
        const channel = await connectRabbitMQ();

        // Register consumers
        await productEventsConsumer(channel);
        await paymentEventsConsumer(channel);

        // Start Outbox Worker Loop
        setInterval(
            processOutboxEvents,
            3000
        );
        processOutboxEvents();

        app.listen(PORT, () => {
            console.log(`[Order Service] Running on port ${PORT}`);
        });

    } catch (error) {
        console.error("[Order Service] Failed to start order service:", error);
    }
};

startServer();
