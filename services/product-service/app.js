import { setupSwagger } from "./swagger.js";
import express from "express";

import categoryRoutes from './src/feature/category/category.route.js';
import productRoutes from './src/feature/product/product.route.js';
import reviewRoutes from './src/feature/review/review.route.js';
import interactionRoutes from './src/feature/interaction/interaction.route.js';
import cors from "cors";

const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"] : "*",
        credentials: true
    })
);

app.use(express.json());

app.use(
    "/categories",
    categoryRoutes
);

app.use(
    "/products",
    reviewRoutes
);

app.use(
    "/interactions",
    interactionRoutes
);

app.use(
    "/products",
    productRoutes
);

setupSwagger(app);
export default app;