import { setupSwagger } from "./swagger.js";
import express from "express";
import cors from "cors";
import cartRoutes from "./src/features/cart/cart.routes.js";

const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true
    })
);

app.use(express.json());

app.use("/cart", cartRoutes);

setupSwagger(app);
export default app;
