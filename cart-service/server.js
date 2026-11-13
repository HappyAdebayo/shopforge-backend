import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import sequelize from "./src/config/db.js";

import "./src/features/cart/cart.model.js";
import "./src/features/cart/cartItem.model.js";
import "./src/features/product/productReplica.model.js";
import "./src/features/cart/cart.associations.js";
import "./src/outbox-service/outbox.model.js";

import { connectRabbitMQ } from "./src/config/rabbitmq.js";
import productEventsConsumer from "./src/events/consumers/productEvents.consumer.js";
import processOutboxEvents from "./src/outbox-service/outbox.worker.js";

const PORT = process.env.PORT || 3006;

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log("[Cart Service] Database connected");

        await sequelize.sync();
        console.log("[Cart Service] Database synchronized");

        // Connect RabbitMQ
        const channel = await connectRabbitMQ();

        // Register event consumers
        await productEventsConsumer(channel);

        // Start Outbox Worker loop
        setInterval(
            processOutboxEvents,
            3000
        );
        processOutboxEvents();

        app.listen(PORT, () => {
            console.log(`[Cart Service] Running on port ${PORT}`);
        });

    } catch (error) {
        console.error("[Cart Service] Failed to start cart service:", error);
    }
};

startServer();
