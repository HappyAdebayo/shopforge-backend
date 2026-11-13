import express from "express";
import NotificationController from "./notification.controller.js";
import authMiddleware from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, NotificationController.index);
router.get("/unread-count", authMiddleware, NotificationController.getUnreadCount);
router.patch("/:id/read", authMiddleware, NotificationController.markAsRead);
router.patch("/read-all", authMiddleware, NotificationController.markAllAsRead);
router.post("/internal", NotificationController.internalCreate);

export default router;
