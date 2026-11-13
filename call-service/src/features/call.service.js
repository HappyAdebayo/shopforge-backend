import Call from "./call.model.js";
import { getIO } from "../config/socket.js";
import outboxService from "../outbox-service/outbox.service.js";
import processOutboxEvents from "../outbox-service/outbox.worker.js";

class CallService {

    async triggerOutbox() {
        try {
            processOutboxEvents();
        } catch (_) {}
    }

    async create(callerId, vendorId, meta = {}) {

        // Clean up any stale or lingering ringing calls from this caller
        const staleCalls = await Call.findAll({
            where: {
                callerId,
                status: "ringing"
            }
        });

        for (const prevCall of staleCalls) {
            prevCall.status = "ended";
            prevCall.endedAt = new Date();
            await prevCall.save();
        }

        let callerName = meta.callerName;
        let vendorName = meta.vendorName;

        if (!vendorName || vendorName.startsWith("Vendor #")) {
            try {
                const vRes = await fetch(`http://localhost:3002/vendors/${vendorId}`).then(r => r.json());
                if (vRes?.data?.businessName) {
                    vendorName = vRes.data.businessName;
                } else {
                    const vuRes = await fetch(`http://localhost:3002/vendors/user/${vendorId}`).then(r => r.json());
                    if (vuRes?.data?.businessName) {
                        vendorName = vuRes.data.businessName;
                    }
                }
            } catch (_) {}
        }

        if (!callerName || callerName.startsWith("User #") || callerName.startsWith("Customer #")) {
            try {
                const uRes = await fetch(`http://localhost:3001/auth/users/${callerId}`).then(r => r.json());
                if (uRes?.data?.name) {
                    callerName = uRes.data.name;
                }
            } catch (_) {}
        }

        callerName = callerName || `Customer #${callerId}`;
        vendorName = vendorName || `Vendor #${vendorId}`;

        const call = await Call.create({
            callerId,
            vendorId,
            callerName,
            vendorName,
            status: "ringing"
        });

        const io = getIO();

        io.to(`vendor:${vendorId}`).emit(
            "incoming-call",
            {
                callId: call.id,
                callerId: call.callerId,
                vendorId: call.vendorId,
                callerName: call.callerName,
                vendorName: call.vendorName,
                status: call.status,
                createdAt: call.createdAt
            }
        );

        // Record outbox event for asynchronous notification / message distribution via RabbitMQ
        await outboxService.createOutboxEvent("CallCreated", {
            callId: call.id,
            callerId: call.callerId,
            vendorId: call.vendorId,
            callerName: call.callerName,
            vendorName: call.vendorName,
            status: call.status,
            createdAt: call.createdAt
        });

        this.triggerOutbox();

        return call;
    }

    async getAll() {

        const calls = await Call.findAll({
            order: [
                ["createdAt", "DESC"]
            ]
        });

        return calls;
    }

    async getById(id) {

        const call = await Call.findByPk(id);

        if (!call) {
            throw new Error("Call not found");
        }

        return call;
    }

    async accept(id, vendorId) {

        const call = await Call.findByPk(id);

        if (!call) {
            throw new Error("Call not found");
        }

        if (call.vendorId !== vendorId) {
            throw new Error(
                "You are not authorized to accept this call"
            );
        }

        if (call.status !== "ringing") {
            throw new Error(
                "Call cannot be accepted"
            );
        }

        call.status = "accepted";
        call.startedAt = new Date();

        await call.save();

        try {
            const io = getIO();
            const payload = {
                callId: call.id,
                callerId: call.callerId,
                vendorId: call.vendorId,
                callerName: call.callerName,
                vendorName: call.vendorName,
                status: call.status,
                startedAt: call.startedAt
            };
            io.to(`call:${call.id}`).emit("call-accepted", payload);
            io.to(`user:${call.callerId}`).emit("call-accepted", payload);
            io.to(`vendor:${call.vendorId}`).emit("call-accepted", payload);
        } catch (e) {
            console.error("Socket error on call accept:", e);
        }

        // Record outbox event for asynchronous notification via RabbitMQ
        await outboxService.createOutboxEvent("CallAccepted", {
            callId: call.id,
            callerId: call.callerId,
            vendorId: call.vendorId,
            callerName: call.callerName,
            vendorName: call.vendorName,
            status: call.status,
            startedAt: call.startedAt
        });

        this.triggerOutbox();

        return call;
    }

    async reject(id, vendorId) {

        const call = await Call.findByPk(id);

        if (!call) {
            throw new Error("Call not found");
        }

        if (call.vendorId !== vendorId) {
            throw new Error(
                "You are not authorized to reject this call"
            );
        }

        if (call.status !== "ringing") {
            throw new Error(
                "Call cannot be rejected"
            );
        }

        call.status = "rejected";

        await call.save();

        try {
            const io = getIO();
            const payload = {
                callId: call.id,
                callerId: call.callerId,
                vendorId: call.vendorId,
                callerName: call.callerName,
                vendorName: call.vendorName,
                status: call.status
            };
            io.to(`call:${call.id}`).emit("call-rejected", payload);
            io.to(`user:${call.callerId}`).emit("call-rejected", payload);
            io.to(`vendor:${call.vendorId}`).emit("call-rejected", payload);
        } catch (e) {
            console.error("Socket error on call reject:", e);
        }

        // Record outbox event for asynchronous notification via RabbitMQ
        await outboxService.createOutboxEvent("CallRejected", {
            callId: call.id,
            callerId: call.callerId,
            vendorId: call.vendorId,
            callerName: call.callerName,
            vendorName: call.vendorName,
            status: call.status
        });

        this.triggerOutbox();

        return call;
    }

    async end(id, userId, role) {

        const call = await Call.findByPk(id);

        if (!call) {
            throw new Error("Call not found");
        }

        if (role === "vendor") {

            if (call.vendorId !== userId) {
                throw new Error(
                    "You are not authorized to end this call"
                );
            }

        } else {

            if (call.callerId !== userId) {
                throw new Error(
                    "You are not authorized to end this call"
                );
            }
        }

        if (call.status !== "accepted" && call.status !== "ringing") {
            throw new Error(
                "Call is not active"
            );
        }

        const wasRinging = call.status === "ringing";

        call.status = "ended";
        call.endedAt = new Date();

        await call.save();

        try {
            const io = getIO();
            const payload = {
                callId: call.id,
                callerId: call.callerId,
                vendorId: call.vendorId,
                callerName: call.callerName,
                vendorName: call.vendorName,
                status: call.status,
                endedAt: call.endedAt
            };
            io.to(`call:${call.id}`).emit("call-ended", payload);
            io.to(`user:${call.callerId}`).emit("call-ended", payload);
            io.to(`vendor:${call.vendorId}`).emit("call-ended", payload);
        } catch (e) {
            console.error("Socket error on call end:", e);
        }

        // Record outbox event for asynchronous notification via RabbitMQ
        await outboxService.createOutboxEvent("CallEnded", {
            callId: call.id,
            callerId: call.callerId,
            vendorId: call.vendorId,
            callerName: call.callerName,
            vendorName: call.vendorName,
            status: call.status,
            endedAt: call.endedAt,
            wasRinging
        });

        this.triggerOutbox();

        return call;
    }
}

export default new CallService();