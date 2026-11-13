import amqp from "amqplib";

let channel;

const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(
            process.env.RABBITMQ_URL || "amqp://localhost:5672"
        );

        channel = await connection.createChannel();

        await channel.assertExchange("shopforge", "topic", { durable: true });

        console.log("Call Service RabbitMQ connected");
    } catch (err) {
        console.warn("Call Service RabbitMQ unavailable:", err.message);
    }
};

const publishEvent = async (event, data) => {
    if (!channel) {
        throw new Error("RabbitMQ is not connected");
    }
    channel.publish(
        "shopforge",
        event,
        Buffer.from(JSON.stringify(data)),
        { persistent: true }
    );
};

export { connectRabbitMQ, publishEvent };