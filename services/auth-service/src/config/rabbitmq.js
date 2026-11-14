import amqp from "amqplib";

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

    console.log("Auth RabbitMQ connected");

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
};

export {
    connectRabbitMQ,
    publishEvent
};

export default connectRabbitMQ;