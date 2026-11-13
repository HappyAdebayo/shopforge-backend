import dotenv from "dotenv";

dotenv.config();

import http from "http";
import { Server } from "socket.io";

import app from "./app.js";
import sequelize from "./src/config/db.js";
import "./src/features/notification/notification.model.js";
import "./src/features/admin/adminUser.model.js";

import { initializeSocket } from "./src/config/socket.js";
import { connectRabbitMQ } from "./src/config/rabbitmq.js";

const PORT = process.env.PORT || 3005;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"] : "*",
        methods: ["GET", "POST", "PATCH", "DELETE"],
        credentials: true
    }
});

initializeSocket(io);

io.on("connection", (socket) => {
    console.log("[Notification Socket] Connected:", socket.id);

    socket.on("join-user", (userId) => {
        if (!userId) return;
        socket.join(`user:${userId}`);
        console.log(`[Notification Socket] User ${userId} joined room user:${userId}`);
    });

    socket.on("join-admin", () => {
        socket.join("admin");
        console.log("[Notification Socket] Admin joined room");
    });

    socket.on("disconnect", () => {
        console.log("[Notification Socket] Disconnected:", socket.id);
    });
});

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database connected");

        await sequelize.sync();
        console.log("Database synchronized");

        await connectRabbitMQ();

        server.listen(PORT, () => {
            console.log(`Notification service running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start notification service:", error);
    }
};

startServer();
