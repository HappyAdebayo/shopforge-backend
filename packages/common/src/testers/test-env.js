
import { z } from "zod";
import loadEnv from "../config/env.js";

const envSchema = z.object({
    APP_PORT: z.coerce.number().positive(),
    APP_NAME: z.string().min(1)
});

const env = loadEnv(envSchema, {
    path: ".env.test"
});

console.log("Environment loaded successfully:");
console.log(env);
