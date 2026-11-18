import { setupSwagger } from "./swagger.js";
import express from "express";
import cors from "cors";
import orderRoutes from "./src/features/order/order.routes.js";

const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true
    })
);

app.use(express.json());

app.use("/orders", orderRoutes);

setupSwagger(app);
export default app;
