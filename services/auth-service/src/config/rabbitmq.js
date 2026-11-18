
import amqp from "amqplib";
import logger from "./logger.js";

let channel;

const connectRabbitMQ = async () => {
    const connection = await amqp.connect(
        process.env.RABBITMQ_URL || "amqp://localhost"
    );

    channel = await connection.createConfirmChannel();

    await channel.assertExchange(
        "shopforge",
        "topic",
        {
            durable: true
        }
    );

    logger.info("Auth RabbitMQ connected");

    return channel;
};

const publishEvent = async (event, data) => {
    if (!channel) {
        throw new Error("RabbitMQ channel is not connected in auth-service");
    }

    channel.publish(
        "shopforge",
        event,
        Buffer.from(JSON.stringify(data)),
        {
            persistent: true
        }
    );

    logger.debug({ event }, "RabbitMQ event published");
};

export {
    connectRabbitMQ,
    publishEvent
};

export default connectRabbitMQ;
