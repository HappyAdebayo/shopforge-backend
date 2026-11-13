import express from "express";
import cartController from "./cart.controller.js";
import authMiddleware from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

// Get current cart & subtotal
router.get("/", cartController.getCart);
router.get("/subtotal", cartController.getSubtotal);

// Validate product availability and stock
router.get("/validate", cartController.validateCart);
router.post("/validate", cartController.validateCart);

// Add product to cart
router.post("/items", cartController.addItem);

// Update quantity
router.patch("/items/:id", cartController.updateQuantity);
router.put("/items/:id", cartController.updateQuantity);

// Remove item
router.delete("/items/:id", cartController.removeItem);

// Clear entire cart
router.delete("/", cartController.clearCart);

export default router;
