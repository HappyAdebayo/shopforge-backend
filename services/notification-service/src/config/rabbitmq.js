import amqp from "amqplib";
import vendorApplicationConsumer from "../events/consumers/vendorApplication.consumer.js";
import callEventsConsumer from "../events/consumers/callEvents.consumer.js";
import orderEventsConsumer from "../events/consumers/orderEvents.consumer.js";
import adminSyncConsumer from "../events/consumers/adminSync.consumer.js";

let channel;

const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://localhost:5672");
        channel = await connection.createChannel();

        await channel.assertExchange("shopforge", "topic", { durable: true });
        console.log("Notification Service connected to RabbitMQ");

        await adminSyncConsumer(channel);
        await vendorApplicationConsumer(channel);
        await callEventsConsumer(channel);
        await orderEventsConsumer(channel);
    } catch (err) {
        console.warn("RabbitMQ connection skipped or unavailable:", err.message);
    }
};

const getChannel = () => channel;

export { connectRabbitMQ, getChannel };
