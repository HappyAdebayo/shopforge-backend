import express from "express";
import ProductController from "./product.controller.js";
import authMiddleware from "../../middleware/auth.middleware.js";
import roleMiddleware from "../../middleware/role.middleware.js";

const router = express.Router();

// Internal service-to-service routes for concurrency-safe stock reservation, release, and confirmation
router.post( "/reserve", ProductController.reserveStock );
router.post( "/release", ProductController.releaseStock );
router.post( "/confirm", ProductController.confirmReservation );

router.post( "/", authMiddleware, roleMiddleware("vendor"), ProductController.create );

router.get( "/my-products", authMiddleware, roleMiddleware("vendor"), ProductController.myProducts );

router.get( "/admin/count", authMiddleware, roleMiddleware("admin"), ProductController.count );

// Public – no auth required so the storefront can list products
router.get( "/", ProductController.index );
router.get( "/:id", ProductController.show );

router.put( "/:id", authMiddleware, roleMiddleware("vendor"), ProductController.update );

router.delete( "/:id", authMiddleware, roleMiddleware("vendor"), ProductController.delete );

export default router;