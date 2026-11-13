import express from "express";
import orderController from "./order.controller.js";
import authMiddleware from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

// Create order
router.post("/", orderController.create);

// List orders (user orders or admin all orders)
router.get("/", orderController.index);

// Get single order
router.get("/:id", orderController.show);

// Update order status
router.patch("/:id/status", orderController.updateStatus);

// Cancel order
router.post("/:id/cancel", orderController.cancel);

export default router;
