
import { z } from "zod";
import {loadEnv} from "../../../../packages/common/src/index.js";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"])
        .default("development"),

    PORT: z.coerce.number().int().positive().default(3001),

    JWT_SECRET: z.string().min(1),
    REFRESH_SECRET: z.string().min(1),

    RABBITMQ_URL: z.string().url(),

    FRONTEND_URL: z.string().url(),

    RESEND_API_KEY: z.string().min(1),
    RESEND_FROM_EMAIL: z.string().email().or(
        z.string().regex(/^.+ <[^<>@\s]+@[^<>@\s]+>$/)
    )
});

const env = loadEnv(envSchema);

export default env;
