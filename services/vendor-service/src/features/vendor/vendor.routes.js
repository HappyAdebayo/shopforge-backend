import express from "express";
import VendorController from "./vendor.controller.js";
import authMiddleware from "../../middleware/auth.middleware.js";
import roleMiddleware from "../../middleware/role.middleware.js";

const router = express.Router();

router.post("/apply",authMiddleware, roleMiddleware("user"), VendorController.apply);
router.get("/applications/my", authMiddleware, VendorController.getMyApplication);
router.patch("/applications/:id/approve", authMiddleware, roleMiddleware("admin"), VendorController.approve);
router.patch( "/applications/:id/reject", authMiddleware, roleMiddleware("admin"), VendorController.reject);
router.get( "/applications", authMiddleware, roleMiddleware("admin"), VendorController.index);
router.get("/user/:userId", VendorController.showByUserId);
router.get("/:id", VendorController.show);
export default router;