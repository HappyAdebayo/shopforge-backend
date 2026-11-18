import express from "express";
import cors from "cors";
import notificationRoutes from "./src/features/notification/notification.routes.js";

const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json({ message: "ShopForge Notification Service is running" });
});

app.use("/notifications", notificationRoutes);

export default app;
