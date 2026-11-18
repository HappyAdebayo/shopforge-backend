
import dotenv from "dotenv";
import { z } from "zod";

const loadEnv = (schema, options = {}) => {
    dotenv.config(options);

    const result = schema.safeParse(process.env);

    if (!result.success) {
        const errors = z.treeifyError(result.error);

        throw new Error(
            `Invalid environment variables:\n${JSON.stringify(errors, null, 2)}`
        );
    }

    return result.data;
};

export default loadEnv;
