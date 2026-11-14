import { setupSwagger } from "./swagger.js";
import express from "express";
import VendorRoutes from "./src/features/vendor/vendor.routes.js";
import cors from "cors";
const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true
    })
);

app.use(express.json());

app.use("/vendors", VendorRoutes);

setupSwagger(app);
export default app;