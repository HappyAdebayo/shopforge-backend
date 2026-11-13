import OutboxEvent from "./outbox.model.js";

const createOutboxEvent = async (
    eventType,
    payload,
    transaction
) => {
    const event = await OutboxEvent.create(
        {
            eventType,
            payload: JSON.stringify(payload)
        },
        {
            transaction
        }
    );

    return event;
};

export default {
    createOutboxEvent
};
