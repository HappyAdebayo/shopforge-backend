import { setupSwagger } from "./swagger.js";
import express from "express";
import cors from "cors";
import paymentRoutes from "./src/features/payment/payment.routes.js";

const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true
    })
);

app.use(express.json());

app.use("/payments", paymentRoutes);

setupSwagger(app);
export default app;
