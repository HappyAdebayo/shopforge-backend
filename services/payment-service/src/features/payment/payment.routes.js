import express from "express";
import paymentController from "./payment.controller.js";
import authMiddleware from "../../middleware/auth.middleware.js";

const router = express.Router();

// Public / webhook routes
router.post("/webhook/:provider", paymentController.handleWebhook);
router.get("/providers", paymentController.getSupportedProviders);
router.post("/verify", paymentController.verify);
router.get("/verify/:reference", paymentController.verify);

// Protected routes
router.post("/initialize", authMiddleware, paymentController.initialize);
router.get("/:reference", authMiddleware, paymentController.getByReference);
router.get("/order/:orderId", authMiddleware, paymentController.getByOrderId);
router.post("/:reference/refund", authMiddleware, paymentController.refund);

export default router;
