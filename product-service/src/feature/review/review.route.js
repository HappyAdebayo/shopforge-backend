import express from "express";
import ReviewController from "./review.controller.js";
import authMiddleware from "../../middleware/auth.middleware.js";

const router = express.Router({ mergeParams: true });

// Public: Get reviews and rating stats for a product
router.get("/:productId/reviews", ReviewController.index);

// Authenticated: Add/update review for a product
router.post("/:productId/reviews", authMiddleware, ReviewController.create);

// Authenticated: Delete a review (owner or admin)
router.delete("/reviews/:reviewId", authMiddleware, ReviewController.delete);

export default router;
