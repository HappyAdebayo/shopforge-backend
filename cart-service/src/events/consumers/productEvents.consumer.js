import ProductReplica from "../../features/product/productReplica.model.js";

const productEventsConsumer = async (channel) => {
    try {
        const queue = await channel.assertQueue(
            "cart-product-events",
            {
                durable: true
            }
        );

        const events = [
            "ProductCreated",
            "ProductUpdated",
            "ProductDeleted",
            "ProductStockUpdated"
        ];

        for (const eventName of events) {
            await channel.bindQueue(
                queue.queue,
                "shopforge",
                eventName
            );
        }

        console.log("Cart service product events consumer registered for queue: cart-product-events");

        channel.consume(
            queue.queue,
            async (message) => {
                if (!message) return;

                try {
                    const eventType = message.fields.routingKey;
                    const data = JSON.parse(message.content.toString());

                    console.log(`[Cart Service] Handling product event ${eventType}:`, data?.id);

                    if (eventType === "ProductCreated" || eventType === "ProductUpdated") {
                        const [replica] = await ProductReplica.upsert({
                            id: data.id,
                            vendorId: data.vendorId,
                            categoryId: data.categoryId,
                            name: data.name,
                            description: data.description,
                            price: data.price,
                            stock: data.stock,
                            status: data.status || "active",
                            imageUrl: data.imageUrl || (Array.isArray(data.images) ? data.images[0]?.imageUrl : null)
                        });
                        console.log(`[Cart Service] Synced product replica ID ${data.id}`);
                    } else if (eventType === "ProductDeleted") {
                        const replica = await ProductReplica.findByPk(data.id);
                        if (replica) {
                            replica.status = "inactive";
                            await replica.save();
                            console.log(`[Cart Service] Marked product replica ID ${data.id} inactive`);
                        }
                    } else if (eventType === "ProductStockUpdated") {
                        const replica = await ProductReplica.findByPk(data.id);
                        if (replica) {
                            replica.stock = data.stock;
                            await replica.save();
                            console.log(`[Cart Service] Updated stock for product replica ID ${data.id} to ${data.stock}`);
                        }
                    }

                    channel.ack(message);
                } catch (error) {
                    console.error("[Cart Service] Error processing product event:", error.message);
                    channel.ack(message);
                }
            }
        );
    } catch (error) {
        console.warn("[Cart Service] Failed to setup product events consumer:", error.message);
    }
};

export default productEventsConsumer;
