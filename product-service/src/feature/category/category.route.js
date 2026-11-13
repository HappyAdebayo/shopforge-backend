import express from "express";

import CategoryController from "./category.controller.js";
import authMiddleware from "../../middleware/auth.middleware.js";
import roleMiddleware from "../../middleware/role.middleware.js";

const router = express.Router();

router.post( "/", authMiddleware, roleMiddleware("admin"), CategoryController.create );

// Public – no auth required so the storefront can list categories
router.get( "/", CategoryController.index );

router.get( "/:id", authMiddleware, roleMiddleware("admin"), CategoryController.show );

router.delete( "/:id", authMiddleware, roleMiddleware("admin"), CategoryController.delete );

export default router;