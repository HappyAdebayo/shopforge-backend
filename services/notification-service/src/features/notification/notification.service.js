import Notification from "./notification.model.js";
import { getIO } from "../../config/socket.js";

class NotificationService {

    async createNotification({ userId, type, title, message, referenceId = null }) {
        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
            referenceId: referenceId ? String(referenceId) : null,
            isRead: false
        });

        // Emit real-time notification via Socket.IO
        try {
            const io = getIO();
            const payload = notification.toJSON ? notification.toJSON() : notification;
            io.to(`user:${userId}`).emit("new-notification", payload);
            if (type.startsWith("vendor_application") || type === "incoming_call") {
                io.to("admin").emit("new-notification", payload);
            }
            console.log(`[Notification Service] Emitted real-time new-notification to user:${userId} (type: ${type})`);
        } catch (e) {
            console.warn("[Notification Service] Socket emit error:", e.message);
        }

        return notification;
    }

    async createBulkNotifications(notifications = []) {
        const created = [];
        for (const item of notifications) {
            const notif = await this.createNotification(item);
            created.push(notif);
        }
        return created;
    }

    async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false }) {
        const offset = (page - 1) * limit;
        const whereClause = { userId };

        if (unreadOnly) {
            whereClause.isRead = false;
        }

        const { rows, count } = await Notification.findAndCountAll({
            where: whereClause,
            order: [["createdAt", "DESC"]],
            limit,
            offset
        });

        const unreadCount = await Notification.count({
            where: { userId, isRead: false }
        });

        return {
            notifications: rows,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit)
            },
            unreadCount
        };
    }

    async getUnreadCount(userId) {
        const count = await Notification.count({
            where: { userId, isRead: false }
        });
        return { unreadCount: count };
    }

    async markAsRead(id, userId) {
        const notification = await Notification.findOne({
            where: { id, userId }
        });

        if (!notification) {
            throw new Error("Notification not found");
        }

        notification.isRead = true;
        await notification.save();

        return notification;
    }

    async markAllAsRead(userId) {
        await Notification.update(
            { isRead: true },
            { where: { userId, isRead: false } }
        );

        return { message: "All notifications marked as read" };
    }
}

export default new NotificationService();
