import OutboxEvent from "./outbox.model.js";

const createOutboxEvent = async (eventType, payload, transaction = null) => {
    const options = transaction ? { transaction } : {};
    const event = await OutboxEvent.create(
        {
            eventType,
            payload: JSON.stringify(payload)
        },
        options
    );
    return event;
};

export default { createOutboxEvent };
