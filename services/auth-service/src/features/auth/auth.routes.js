import express from "express";
import AuthController from "./auth.controller.js";

const router = express.Router();

router.post("/signup", AuthController.signup);
router.post("/login", AuthController.login);
router.post("/refresh", AuthController.refresh);
router.get("/users/:id", AuthController.getUserById);

// Internal route — used by other microservices (e.g. notification-service)
router.get("/internal/admins", AuthController.getAdminUsers);

export default router;