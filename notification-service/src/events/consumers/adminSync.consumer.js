import AdminUser from "../../features/admin/adminUser.model.js";

const adminSyncConsumer = async (channel) => {
    try {
        const queue = await channel.assertQueue("notification-admin-sync", {
            durable: true
        });

        await channel.bindQueue(queue.queue, "shopforge", "AdminUserSynced");
        await channel.bindQueue(queue.queue, "shopforge", "AdminUserRegistered");
        await channel.bindQueue(queue.queue, "shopforge", "UserRoleChanged");

        console.log("[Notification Service] Admin sync consumer registered on RabbitMQ");

        // Seed default admin if replica is empty
        const count = await AdminUser.count();
        if (count === 0) {
            await AdminUser.upsert({
                id: 1,
                name: "Happy Adebayo",
                email: "happyadebayo2005@gmail.com"
            });
            console.log("[Notification Service] Default admin replica initialized in database");
        }

        channel.consume(queue.queue, async (message) => {
            if (!message) return;

            try {
                const eventType = message.fields.routingKey;
                const data = JSON.parse(message.content.toString());

                console.log(`[Notification Service] Received admin event "${eventType}":`, data);

                if (eventType === "AdminUserSynced" && Array.isArray(data.admins)) {
                    for (const admin of data.admins) {
                        await AdminUser.upsert({
                            id: admin.id,
                            name: admin.name,
                            email: admin.email
                        });
                    }
                } else if (eventType === "AdminUserRegistered" || (eventType === "UserRoleChanged" && data.role === "admin")) {
                    await AdminUser.upsert({
                        id: data.userId || data.id,
                        name: data.name,
                        email: data.email
                    });
                } else if (eventType === "UserRoleChanged" && data.role !== "admin") {
                    await AdminUser.destroy({
                        where: { id: data.userId || data.id }
                    });
                }

                channel.ack(message);
            } catch (err) {
                console.error("[Notification Service] Error in admin sync consumer:", err.message);
                channel.ack(message);
            }
        });
    } catch (err) {
        console.warn("[Notification Service] Failed to setup admin sync consumer:", err.message);
    }
};

export default adminSyncConsumer;