import OutboxEvent from "./outbox.model.js";
import { publishEvent } from "../config/rabbitmq.js";

const processOutboxEvents = async () => {
    try {
        const events = await OutboxEvent.findAll({
            where: {
                status: "pending"
            },
            order: [
                ["createdAt", "ASC"]
            ]
        });

        for (const event of events) {
            try {
                await publishEvent(
                    event.eventType,
                    JSON.parse(event.payload)
                );

                event.status = "processed";
                event.processedAt = new Date();

                await event.save();

                console.log(
                    `[Call Outbox] Event ${event.id} (${event.eventType}) published successfully`
                );
            } catch (error) {
                // If RabbitMQ is down, will retry in the next interval
                console.warn(
                    `[Call Outbox] Failed to publish event ${event.id}:`,
                    error.message
                );
            }
        }
    } catch (err) {
        console.warn("[Call Outbox Worker] Error query:", err.message);
    }
};

export default processOutboxEvents;
