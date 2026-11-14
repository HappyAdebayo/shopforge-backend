import interactionService from "../../feature/interaction/interaction.service.js";

const cartEventsConsumer = async (channel) => {
    try {
        const queue = await channel.assertQueue("product-cart-events", {
            durable: true
        });

        await channel.bindQueue(queue.queue, "shopforge", "CartItemAdded");

        console.log("[Product Service] Cart events consumer registered for queue: product-cart-events");

        channel.consume(queue.queue, async (message) => {
            if (!message) return;

            try {
                const eventType = message.fields.routingKey;
                const data = JSON.parse(message.content.toString());

                console.log(`[Product Service] Received cart event "${eventType}":`, data);

                if (eventType === "CartItemAdded") {
                    if (data.userId && data.productId) {
                        await interactionService.recordInteraction({
                            userId: data.userId,
                            productId: data.productId,
                            event: "addtocart",
                            timestamp: new Date()
                        });
                        console.log(`[Product Service] Recorded "addtocart" interaction for user ${data.userId} and product ${data.productId}`);
                    }
                }

                channel.ack(message);
            } catch (err) {
                console.error("[Product Service] Error processing cart event:", err.message);
                channel.ack(message);
            }
        });
    } catch (err) {
        console.warn("[Product Service] Failed to setup cart events consumer:", err.message);
    }
};

export default cartEventsConsumer;
