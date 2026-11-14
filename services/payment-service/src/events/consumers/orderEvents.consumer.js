import paymentService from "../../features/payment/payment.service.js";

const orderEventsConsumer = async (channel) => {
    try {
        const queue = await channel.assertQueue(
            "payment-order-events",
            {
                durable: true
            }
        );

        await channel.bindQueue(
            queue.queue,
            "shopforge",
            "OrderCreated"
        );

        console.log("[Payment Service] Order events consumer registered for queue: payment-order-events");

        channel.consume(
            queue.queue,
            async (message) => {
                if (!message) return;

                try {
                    const data = JSON.parse(message.content.toString());
                    console.log(`[Payment Service] Received OrderCreated event for Order #${data.orderNumber} (ID: ${data.orderId})`);

                    // Automatically initialize payment record for the created order
                    const payment = await paymentService.initializePayment(data.userId, {
                        orderId: data.orderId,
                        amount: data.totalAmount,
                        currency: data.currency || "USD",
                        customerEmail: data.customerEmail,
                        provider: data.paymentProvider || "mock",
                        metadata: {
                            orderNumber: data.orderNumber,
                            itemCount: Array.isArray(data.items) ? data.items.length : 0
                        }
                    });

                    console.log(`[Payment Service] Initialized payment ${payment.reference} for Order #${data.orderNumber}`);

                    channel.ack(message);
                } catch (error) {
                    console.error("[Payment Service] Error handling OrderCreated event:", error.message);
                    channel.ack(message);
                }
            }
        );
    } catch (error) {
        console.warn("[Payment Service] Failed to setup order events consumer:", error.message);
    }
};

export default orderEventsConsumer;
