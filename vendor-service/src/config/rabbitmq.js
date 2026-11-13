import amqp from "amqplib";

let channel;

const connectRabbitMQ = async () => {

    const connection = await amqp.connect(
        process.env.RABBITMQ_URL
    );

    channel = await connection.createChannel();

    await channel.assertExchange(
        "shopforge",
        "topic",
        {
            durable: true
        }
    );

    console.log("RabbitMQ connected");
};

const publishEvent = async (event, data) => {

    if (!channel) {
        throw new Error("RabbitMQ is not connected");
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