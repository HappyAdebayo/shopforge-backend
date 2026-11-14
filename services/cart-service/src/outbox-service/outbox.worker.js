import OutboxEvent from "./outbox.model.js";
import { publishEvent } from "../config/rabbitmq.js";

const processOutboxEvents = async () => {
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
                `[Cart Outbox] Event ${event.id} (${event.eventType}) published successfully`
            );
        } catch (error) {
            console.error(
                `[Cart Outbox] Failed to publish event ${event.id}:`,
                error.message
            );
        }
    }
};

export default processOutboxEvents;
