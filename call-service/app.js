import express from "express";
import cors from "cors";

import callRoutes from "./src/features/call.routes.js";

const app = express();


app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true
    })
);

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


app.get("/", (req, res) => {

    res.json({
        message: "ShopForge Call Service is running"
    });

});


app.use("/calls", callRoutes);


export default app;