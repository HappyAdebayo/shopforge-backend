import { setupSwagger } from "./swagger.js";
import express from "express";
import AuthRoutes from "./src/features/auth/auth.routes.js";
import cors from "cors";

const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true
    })
);

app.use(express.json());

app.use("/auth", AuthRoutes);
app.use("/api/auth", AuthRoutes);

setupSwagger(app);
export default app;