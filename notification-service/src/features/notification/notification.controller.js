import NotificationService from "./notification.service.js";

class NotificationController {

    async index(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 20;
            const unreadOnly = req.query.unreadOnly === "true";

            const result = await NotificationService.getUserNotifications(userId, {
                page,
                limit,
                unreadOnly
            });

            return res.status(200).json({
                message: "Notifications retrieved successfully",
                data: result
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getUnreadCount(req, res) {
        try {
            const userId = req.user.id;
            const result = await NotificationService.getUnreadCount(userId);
            return res.status(200).json({
                message: "Unread count retrieved successfully",
                data: result
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async markAsRead(req, res) {
        try {
            const userId = req.user.id;
            const id = req.params.id;

            const result = await NotificationService.markAsRead(id, userId);

            return res.status(200).json({
                message: "Notification marked as read",
                data: result
            });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    async markAllAsRead(req, res) {
        try {
            const userId = req.user.id;
            const result = await NotificationService.markAllAsRead(userId);

            return res.status(200).json({
                message: "All notifications marked as read",
                data: result
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async internalCreate(req, res) {
        try {
            const { notifications, userId, type, title, message, referenceId } = req.body;

            if (Array.isArray(notifications)) {
                const results = await NotificationService.createBulkNotifications(notifications);
                return res.status(201).json({ message: "Notifications created", data: results });
            }

            if (!userId || !type || !title || !message) {
                return res.status(400).json({ message: "userId, type, title, and message are required" });
            }

            const result = await NotificationService.createNotification({
                userId,
                type,
                title,
                message,
                referenceId
            });

            return res.status(201).json({ message: "Notification created", data: result });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}

export default new NotificationController();
