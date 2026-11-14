
const MAX_ATTEMPTS = 3;

const retryMessage = async ({
    channel,
    message,
    retryQueue,
    deadLetterQueue,
    error,
    permanent = false
}) => {
    const headers = message.properties.headers || {};
    const attempts = headers["x-retry-count"] || 0;

    const exhausted = attempts >= MAX_ATTEMPTS - 1;
    const destination =
        permanent || exhausted ? deadLetterQueue : retryQueue;

    const nextAttempts =
        permanent || exhausted ? attempts : attempts + 1;

    channel.sendToQueue(
        destination,
        message.content,
        {
            persistent: true,
            contentType: message.properties.contentType,
            headers: {
                ...headers,
                "x-retry-count": nextAttempts,
                "x-error": error.message
            }
        }
    );

    // Wait until RabbitMQ confirms it received the new message.
    await channel.waitForConfirms();

    // Only acknowledge the original after confirmation.
    channel.ack(message);

    if (destination === deadLetterQueue) {
        console.error("[RabbitMQ] Message moved to dead-letter queue:", error.message);
    } else {
        console.log(
            `[RabbitMQ] Message scheduled for retry ${nextAttempts + 1}/${MAX_ATTEMPTS}`
        );
    }
};

export default retryMessage;
