import orderService from "../../features/order/order.service.js";

const paymentEventsConsumer = async (channel) => {
    try {
        const queue = await channel.assertQueue(
            "order-payment-events",
            {
                durable: true
            }
        );

        const paymentEvents = [
            "PaymentSuccessful",
            "PaymentFailed",
            "PaymentRefunded"
        ];

        for (const eventName of paymentEvents) {
            await channel.bindQueue(
                queue.queue,
                "shopforge",
                eventName
            );
        }

        console.log("[Order Service] Payment events consumer registered for queue: order-payment-events");

        channel.consume(
            queue.queue,
            async (message) => {
                if (!message) return;

                try {
                    const eventType = message.fields.routingKey;
                    const data = JSON.parse(message.content.toString());

                    console.log(`[Order Service] Received payment event "${eventType}" for order ID ${data?.orderId}`);

                    if (eventType === "PaymentSuccessful") {
                        await orderService.handlePaymentSuccessful(data);
                    } else if (eventType === "PaymentFailed") {
                        await orderService.handlePaymentFailed(data);
                    } else if (eventType === "PaymentRefunded") {
                        console.log(`[Order Service] Payment refunded for order ID ${data?.orderId}`);
                    }

                    channel.ack(message);
                } catch (error) {
                    console.error("[Order Service] Error processing payment event:", error.message);
                    channel.ack(message);
                }
            }
        );
    } catch (error) {
        console.warn("[Order Service] Failed to setup payment events consumer:", error.message);
    }
};

export default paymentEventsConsumer;
