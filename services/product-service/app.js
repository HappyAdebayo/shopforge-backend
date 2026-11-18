import { setupSwagger } from "./swagger.js";
import express from "express";

import categoryRoutes from './src/feature/category/category.route.js';
import productRoutes from './src/feature/product/product.route.js';
import reviewRoutes from './src/feature/review/review.route.js';
import interactionRoutes from './src/feature/interaction/interaction.route.js';
import errorHandler from "./src/middleware/errorHandler.js";

import cors from "cors";

const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true
    })
);

app.use(express.json());

app.use("/categories",categoryRoutes);

app.use("/products", reviewRoutes);

app.use( "/interactions",interactionRoutes);

app.use( "/products",productRoutes);

setupSwagger(app);

app.use(errorHandler)
export default app;
