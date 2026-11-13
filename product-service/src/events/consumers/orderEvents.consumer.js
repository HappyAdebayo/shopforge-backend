import productService from "../../feature/product/product.service.js";
import interactionService from "../../feature/interaction/interaction.service.js";

const orderEventsConsumer = async (channel) => {
    try {
        const queue = await channel.assertQueue("product-order-events", {
            durable: true
        });

        await channel.bindQueue(queue.queue, "shopforge", "OrderConfirmed");
        await channel.bindQueue(queue.queue, "shopforge", "OrderPaymentFailed");
        await channel.bindQueue(queue.queue, "shopforge", "OrderCancelled");

        console.log("[Product Service] Order events consumer registered for queue: product-order-events");

        channel.consume(queue.queue, async (message) => {
            if (!message) return;

            try {
                const eventType = message.fields.routingKey;
                const data = JSON.parse(message.content.toString());

                console.log(`[Product Service] Received event "${eventType}" for order ID ${data?.orderId}`);

                if (eventType === "OrderPaymentFailed" || eventType === "OrderCancelled") {
                    // Automatically release previously reserved stock back to the shelf under row-level lock
                    console.log(`[Product Service] Releasing reserved stock for order ID ${data.orderId} due to ${eventType}...`);
                    await productService.releaseStock({
                        orderId: data.orderId,
                        orderNumber: data.orderNumber,
                        items: Array.isArray(data.items) ? data.items : []
                    });
                    console.log(`[Product Service] Successfully released stock for order ID ${data.orderId}`);
                } else if (eventType === "OrderConfirmed") {
                    // Transition reservation status from "reserved" to "confirmed"
                    console.log(`[Product Service] Confirming stock reservation for order ID ${data.orderId}...`);
                    await productService.confirmReservation(data.orderId || data.orderNumber);
                    console.log(`[Product Service] Order #${data.orderNumber} (ID: ${data.orderId}) confirmed. Stock reservation finalized.`);

                    // Record transaction interactions for completed payment
                    if (data.userId && Array.isArray(data.items) && data.items.length > 0) {
                        const transactions = data.items.map(item => ({
                            userId: data.userId,
                            productId: item.productId,
                            event: "transaction",
                            timestamp: new Date()
                        }));
                        await interactionService.recordBatchInteractions(transactions);
                        console.log(`[Product Service] Recorded ${transactions.length} transaction interaction(s) for user ID ${data.userId}`);
                    }
                }

                channel.ack(message);
            } catch (err) {
                console.error("[Product Service] Error processing order event:", err.message);
                channel.ack(message);
            }
        });
    } catch (err) {
        console.warn("[Product Service] Failed to setup order events consumer:", err.message);
    }
};

export default orderEventsConsumer;
