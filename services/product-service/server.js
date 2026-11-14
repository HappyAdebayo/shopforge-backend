import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import sequelize from "./src/config/db.js";

import "./src/feature/category/category.model.js";
import "./src/feature/product/product.model.js";
import "./src/feature/product/stockReservation.model.js";
import "./src/feature/review/review.model.js";
import "./src/feature/interaction/interaction.model.js";
import "./src/associations.js";
import "./src/outbox-service/outbox.model.js";

import { connectRabbitMQ } from "./src/config/rabbitmq.js";
import processOutboxEvents from "./src/outbox-service/outbox.worker.js";
import orderEventsConsumer from "./src/events/consumers/orderEvents.consumer.js";
import cartEventsConsumer from "./src/events/consumers/cartEvents.consumer.js";
import productService from "./src/feature/product/product.service.js";

const PORT = process.env.PORT || 3003;

const startServer = async () => {

    try {

        await sequelize.authenticate();

        console.log("Database connected");

        await sequelize.sync();

        console.log("Database synchronized");

        // Connect RabbitMQ
        const channel = await connectRabbitMQ();

        // Register event consumers
        await orderEventsConsumer(channel);
        await cartEventsConsumer(channel);


        // Start Outbox Worker loop
        setInterval(
            processOutboxEvents,
            3000
        );
        processOutboxEvents();

        // Start Expired Stock Reservations Cleanup loop (runs every 60s)
        setInterval(
            () => productService.releaseExpiredReservations(),
            60000
        );

        app.listen(PORT, () => {
            console.log(
                `Product service running on port ${PORT}`
            );
        });

    } catch (error) {

        console.error(
            "Failed to start product service:",
            error
        );

    }
};

startServer();