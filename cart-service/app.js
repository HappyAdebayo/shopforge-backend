import { setupSwagger } from "./swagger.js";
import express from "express";
import cors from "cors";
import cartRoutes from "./src/features/cart/cart.routes.js";

const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"] : "*",
        credentials: true
    })
);

app.use(express.json());

app.use("/cart", cartRoutes);

setupSwagger(app);
export default app;
