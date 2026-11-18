
import OutboxEvent from "./outbox.model.js";
import { publishEvent } from "../config/rabbitmq.js";
import logger from "../config/logger.js";

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

            logger.info(
                {
                    eventId: event.id,
                    eventType: event.eventType
                },
                "Outbox event published successfully"
            );

        } catch (error) {
            logger.error(
                {
                    err: error,
                    eventId: event.id,
                    eventType: event.eventType
                },
                "Failed to publish outbox event"
            );
        }
    }
};

export default processOutboxEvents;