
const RETRY_DELAY = 10000;

const configureRetryQueues = async (channel, mainQueue) => {
    const retryQueue = `${mainQueue}.retry`;
    const deadLetterQueue = `${mainQueue}.dlq`;

    // Queue where permanently failed messages are stored.
    await channel.assertQueue(deadLetterQueue, {
        durable: true
    });

    // Temporary queue that holds messages before retrying.
    await channel.assertQueue(retryQueue, {
        durable: true,
        arguments: {
            "x-message-ttl": RETRY_DELAY,
            "x-dead-letter-exchange": "",
            "x-dead-letter-routing-key": mainQueue
        }
    });

    return {
        retryQueue,
        deadLetterQueue
    };
};

export default configureRetryQueues;
