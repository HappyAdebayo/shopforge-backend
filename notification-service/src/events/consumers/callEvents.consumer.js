import notificationService from "../../features/notification/notification.service.js";

const callEventsConsumer = async (channel) => {
    try {
        const queue = await channel.assertQueue("notification-call-events", {
            durable: true
        });

        const callEvents = [
            "CallCreated",
            "CallAccepted",
            "CallRejected",
            "CallEnded"
        ];

        for (const eventName of callEvents) {
            await channel.bindQueue(queue.queue, "shopforge", eventName);
        }

        console.log("Call events consumer registered for queue: notification-call-events");

        channel.consume(queue.queue, async (message) => {
            if (!message) return;

            try {
                const eventType = message.fields.routingKey;
                const data = JSON.parse(message.content.toString());

                console.log(`[Notification Service] Received call event ${eventType}:`, data);

                if (eventType === "CallCreated") {
                    // Notification for vendor
                    await notificationService.createNotification({
                        userId: data.vendorId,
                        type: "incoming_call",
                        title: "Incoming Call",
                        message: `${data.callerName || 'A customer'} is calling you.`,
                        referenceId: String(data.callId)
                    });
                } else if (eventType === "CallAccepted") {
                    // Notification for caller
                    await notificationService.createNotification({
                        userId: data.callerId,
                        type: "call_accepted",
                        title: "Call Connected",
                        message: `Your call with ${data.vendorName || 'the vendor'} was connected.`,
                        referenceId: String(data.callId)
                    });
                    // Notification for vendor
                    await notificationService.createNotification({
                        userId: data.vendorId,
                        type: "call_accepted",
                        title: "Call Connected",
                        message: `You connected a call with ${data.callerName || 'a customer'}.`,
                        referenceId: String(data.callId)
                    });
                } else if (eventType === "CallRejected") {
                    // Notification for caller
                    await notificationService.createNotification({
                        userId: data.callerId,
                        type: "call_rejected",
                        title: "Call Declined",
                        message: `Your call to ${data.vendorName || 'the vendor'} was declined.`,
                        referenceId: String(data.callId)
                    });
                    // Notification for vendor
                    await notificationService.createNotification({
                        userId: data.vendorId,
                        type: "call_rejected",
                        title: "Call Declined",
                        message: `You declined the call from ${data.callerName || 'a customer'}.`,
                        referenceId: String(data.callId)
                    });
                } else if (eventType === "CallEnded") {
                    if (data.wasRinging) {
                        // Vendor missed call
                        await notificationService.createNotification({
                            userId: data.vendorId,
                            type: "call_missed",
                            title: "Missed Call",
                            message: `You missed a call from ${data.callerName || 'a customer'}.`,
                            referenceId: String(data.callId)
                        });
                        // Caller unanswered call
                        await notificationService.createNotification({
                            userId: data.callerId,
                            type: "call_missed",
                            title: "Unanswered Call",
                            message: `Your call to ${data.vendorName || 'the vendor'} was not answered.`,
                            referenceId: String(data.callId)
                        });
                    } else {
                        // Both parties on completed call
                        await notificationService.createNotification({
                            userId: data.callerId,
                            type: "call_ended",
                            title: "Call Ended",
                            message: `Your call with ${data.vendorName || 'the vendor'} ended.`,
                            referenceId: String(data.callId)
                        });
                        await notificationService.createNotification({
                            userId: data.vendorId,
                            type: "call_ended",
                            title: "Call Ended",
                            message: `Your call with ${data.callerName || 'a customer'} ended.`,
                            referenceId: String(data.callId)
                        });
                    }
                }

                channel.ack(message);
            } catch (err) {
                console.error("[Notification Service] Error processing call event:", err.message);
                channel.ack(message);
            }
        });
    } catch (err) {
        console.warn("[Notification Service] Failed to setup call events consumer:", err.message);
    }
};

export default callEventsConsumer;
