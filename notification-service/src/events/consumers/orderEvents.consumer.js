import notificationService from "../../features/notification/notification.service.js";
import AdminUser from "../../features/admin/adminUser.model.js";

/**
 * Retrieves all admin users from local replica synchronized via RabbitMQ.
 */
const getAdminUsers = async () => {
    try {
        const admins = await AdminUser.findAll();
        if (admins && admins.length > 0) return admins;
    } catch (err) {
        console.warn("[Notification Service] Could not read admin users replica:", err.message);
    }
    return [{ id: 1, name: "Admin" }];
};

const orderEventsConsumer = async (channel) => {
    try {
        const queue = await channel.assertQueue("notification-order-events", {
            durable: true
        });

        await channel.bindQueue(queue.queue, "shopforge", "OrderConfirmed");
        await channel.bindQueue(queue.queue, "shopforge", "ProductStockUpdated");
        await channel.bindQueue(queue.queue, "shopforge", "OrderPaymentFailed");

        console.log("[Notification Service] Order events consumer registered for queue: notification-order-events");

        channel.consume(queue.queue, async (message) => {
            if (!message) return;

            try {
                const eventType = message.fields.routingKey;
                const data = JSON.parse(message.content.toString());

                console.log(`[Notification Service] Received event "${eventType}"`);

                if (eventType === "OrderConfirmed") {
                    const items = Array.isArray(data.items) ? data.items : [];

                    // 1. Send sale notifications to the respective vendor(s)
                    for (const item of items) {
                        if (!item.vendorId) continue;

                        await notificationService.createNotification({
                            userId: item.vendorId,
                            type: "sale_made",
                            title: "Product Sold! 🎉",
                            message: `Your product "${item.name}" sold ${item.quantity} unit(s) — Order #${data.orderNumber}.`,
                            referenceId: String(data.orderId)
                        });

                        console.log(
                            `[Notification Service] Sale notification sent to vendor ${item.vendorId} ` +
                            `for product "${item.name}" (qty: ${item.quantity})`
                        );
                    }

                    // 2. Notify the buyer / customer
                    if (data.userId) {
                        await notificationService.createNotification({
                            userId: data.userId,
                            type: "order_confirmed",
                            title: "Order Confirmed! 🛍️",
                            message: `Your order #${data.orderNumber} ($${Number(data.totalAmount || 0).toFixed(2)}) has been confirmed.`,
                            referenceId: String(data.orderId)
                        });
                    }

                    // 3. Notify all admins of the new purchase
                    const admins = await getAdminUsers();
                    for (const admin of admins) {
                        await notificationService.createNotification({
                            userId: admin.id,
                            type: "order_confirmed",
                            title: "New Order Placed 📦",
                            message: `Order #${data.orderNumber} for $${Number(data.totalAmount || 0).toFixed(2)} (${items.length} product(s)) was placed.`,
                            referenceId: String(data.orderId)
                        });
                        console.log(`[Notification Service] Order notification sent to admin ${admin.id} for order #${data.orderNumber}`);
                    }

                } else if (eventType === "ProductStockUpdated") {
                    // Fired by product-service after deducting stock; notify the vendor of remaining stock
                    if (!data.vendorId) return channel.ack(message);

                    await notificationService.createNotification({
                        userId: data.vendorId,
                        type: "stock_update",
                        title: "Stock Updated",
                        message: `"${data.name}" now has ${data.stock} unit(s) remaining after selling ${data.quantitySold}.`,
                        referenceId: String(data.id)
                    });

                    console.log(
                        `[Notification Service] Stock update notification sent to vendor ${data.vendorId} ` +
                        `for product "${data.name}" (stock: ${data.stock})`
                    );

                } else if (eventType === "OrderPaymentFailed") {
                    // Notify customer in real time that their payment failed
                    if (data.userId) {
                        await notificationService.createNotification({
                            userId: data.userId,
                            type: "payment_failed",
                            title: "Payment Failed ⚠️",
                            message: `Your payment for Order #${data.orderNumber} failed: ${data.reason || "Transaction could not be completed"}. Please retry payment.`,
                            referenceId: String(data.orderId)
                        });

                        console.log(
                            `[Notification Service] Payment failure notification sent to customer ${data.userId} for order #${data.orderNumber}`
                        );
                    }
                }

                channel.ack(message);
            } catch (err) {
                console.error("[Notification Service] Error processing order event:", err.message);
                channel.ack(message);
            }
        });
    } catch (err) {
        console.warn("[Notification Service] Failed to setup order events consumer:", err.message);
    }
};

export default orderEventsConsumer;

