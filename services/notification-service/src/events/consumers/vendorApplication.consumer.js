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

const vendorApplicationConsumer = async (channel) => {
    try {
        const queue = await channel.assertQueue("notification-vendor-applications", {
            durable: true
        });

        const appEvents = [
            "VendorApplicationSubmitted",
            "VendorApplicationApproved",
            "VendorApplicationRejected"
        ];

        for (const eventName of appEvents) {
            await channel.bindQueue(queue.queue, "shopforge", eventName);
        }

        console.log("Vendor application consumer registered for queue: notification-vendor-applications");

        channel.consume(queue.queue, async (message) => {
            if (!message) return;

            try {
                const eventType = message.fields.routingKey;
                const data = JSON.parse(message.content.toString());

                console.log(`[Notification Service] Received vendor application event ${eventType}:`, data);

                if (eventType === "VendorApplicationSubmitted") {
                    // 1. Notify the applicant
                    await notificationService.createNotification({
                        userId: data.userId,
                        type: "vendor_application_submitted",
                        title: "Application Received",
                        message: `Your application for "${data.businessName}" has been submitted for review.`,
                        referenceId: String(data.applicationId)
                    });

                    // 2. Notify every admin user
                    const admins = await getAdminUsers();
                    for (const admin of admins) {
                        await notificationService.createNotification({
                            userId: admin.id,
                            type: "vendor_application_submitted",
                            title: "New Vendor Application",
                            message: `A new vendor application from "${data.businessName}" is awaiting your review.`,
                            referenceId: String(data.applicationId)
                        });
                    }

                    if (admins.length > 0) {
                        console.log(`[Notification Service] Notified ${admins.length} admin(s) of new vendor application (id: ${data.applicationId})`);
                    }

                } else if (eventType === "VendorApplicationApproved") {
                    await notificationService.createNotification({
                        userId: data.userId,
                        type: "vendor_application_approved",
                        title: "Application Approved!",
                        message: `Congratulations! Your vendor store "${data.businessName}" has been approved.`,
                        referenceId: String(data.applicationId)
                    });
                } else if (eventType === "VendorApplicationRejected") {
                    await notificationService.createNotification({
                        userId: data.userId,
                        type: "vendor_application_rejected",
                        title: "Application Declined",
                        message: `Your vendor application for "${data.businessName}" was declined.`,
                        referenceId: String(data.applicationId)
                    });
                }

                channel.ack(message);
            } catch (err) {
                console.error("[Notification Service] Error processing vendor app event:", err.message);
                channel.ack(message);
            }
        });
    } catch (err) {
        console.warn("[Notification Service] Failed to setup vendor app consumer:", err.message);
    }
};

export default vendorApplicationConsumer;
