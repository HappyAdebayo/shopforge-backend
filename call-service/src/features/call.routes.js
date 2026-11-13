import express from "express";

import CallController from "./call.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();


router.post(
    "/",
    authMiddleware,
    CallController.create
);


router.get(
    "/",
    authMiddleware,
    CallController.index
);


router.get(
    "/:id",
    authMiddleware,
    CallController.show
);


router.patch(
    "/:id/accept",
    authMiddleware,
    CallController.accept
);


router.patch(
    "/:id/reject",
    authMiddleware,
    CallController.reject
);


router.patch(
    "/:id/end",
    authMiddleware,
    CallController.end
);


export default router;