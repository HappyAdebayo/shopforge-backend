import express from "express";
import jwt from "jsonwebtoken";
import interactionController from "./interaction.controller.js";
import authMiddleware from "../../middleware/auth.middleware.js";

const router = express.Router();

const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            if (token) {
                const decoded = jwt.verify(
                    token,
                    process.env.JWT_SECRET || "supersecretjwtkey_change_in_production"
                );
                req.user = decoded;
            }
        }
    } catch {
        // Continue without user object if token invalid or expired
    }
    next();
};

// Record interaction (supports authenticated requests or passing userId in body)
router.post("/", optionalAuth, interactionController.record);

// Get current user's interactions
router.get("/my", authMiddleware, interactionController.myInteractions);

// Get interaction statistics for a specific product
router.get("/product/:productId/stats", interactionController.productStats);

// Get raw interactions for a specific product
router.get("/product/:productId", optionalAuth, interactionController.productInteractions);

export default router;
