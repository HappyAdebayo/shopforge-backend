import dotenv from "dotenv";

dotenv.config();

import http from "http";
import { Server } from "socket.io";

import app from "./app.js";
import sequelize from "./src/config/db.js";

import "./src/features/call.model.js";
import "./src/outbox-service/outbox.model.js";

import { initializeSocket } from "./src/config/socket.js";
import { connectRabbitMQ } from "./src/config/rabbitmq.js";
import processOutboxEvents from "./src/outbox-service/outbox.worker.js";

const PORT = process.env.PORT || 3004;

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

    console.log(
        "Socket connected:",
        socket.id
    );

    socket.on("join-vendor", (vendorId) => {
        if (!vendorId) return;
        const room = `vendor:${vendorId}`;
        socket.join(room);
        console.log(`Vendor ${vendorId} joined room ${room}`);
    });

    socket.on("join-user", (userId) => {
        if (!userId) return;
        const room = `user:${userId}`;
        socket.join(room);
        console.log(`User ${userId} joined room ${room}`);
    });

    socket.on("join-call", (callId) => {
        if (!callId) return;
        const room = `call:${callId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined call room ${room}`);
    });

    socket.on("leave-call", (callId) => {
        if (!callId) return;
        const room = `call:${callId}`;
        socket.leave(room);
        console.log(`Socket ${socket.id} left call room ${room}`);
    });

    socket.on("webrtc-signal", ({ callId, signal }) => {
        if (!callId) return;
        socket.to(`call:${callId}`).emit("webrtc-signal", { from: socket.id, signal, callId });
    });

    socket.on("video-toggle", ({ callId, isVideoEnabled }) => {
        if (!callId) return;
        socket.to(`call:${callId}`).emit("video-toggle", { from: socket.id, isVideoEnabled, callId });
    });

    socket.on("call-signal", ({ callId, target, data }) => {
        if (target) {
            io.to(target).emit("call-signal", { from: socket.id, data, callId });
        } else if (callId) {
            socket.to(`call:${callId}`).emit("call-signal", { from: socket.id, data, callId });
        }
    });

    socket.on("disconnect", () => {
        console.log(
            "Socket disconnected:",
            socket.id
        );
    });

});


const startServer = async () => {

    try {

        await sequelize.authenticate();

        console.log("Database connected");


        await sequelize.sync();

        console.log("Database synchronized");

        // Connect RabbitMQ
        await connectRabbitMQ();

        // Start Outbox Worker loop
        setInterval(
            processOutboxEvents,
            3000
        );
        processOutboxEvents();

        server.listen(PORT, () => {

            console.log(
                `Call service running on port ${PORT}`
            );

        });

    } catch (error) {

        console.error(
            "Failed to start call service:",
            error
        );

    }

};


startServer();