import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import sequelize from "./src/config/db.js";

import "./src/features/vendor/vendor.model.js";
import "./src/features/vendor/vendorApplication.model.js";
import "./src/outbox-service/outbox.model.js";

import { connectRabbitMQ } from "./src/config/rabbitmq.js";
import processOutboxEvents from "./src/outbox-service/outbox.worker.js";

const PORT = process.env.PORT || 3002;

const startServer = async () => {

    try {

        await sequelize.authenticate();

        console.log("Database connected");

        await sequelize.sync();

        console.log("Database synchronized");

        await connectRabbitMQ();

        setInterval(
            processOutboxEvents,
            5000
        );

        app.listen(PORT, () => {
            console.log(
                `Vendor service running on port ${PORT}`
            );
        });

    } catch (error) {

        console.error(
            "Failed to start vendor service:",
            error
        );
    }
};

startServer();