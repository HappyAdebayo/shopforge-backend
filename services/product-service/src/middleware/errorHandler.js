
import { HttpError } from "../../../../packages/common/src/index.js";
import logger from "../config/logger.js";

const errorHandler = (err, req, res, next) => {
    logger.error(
        {
            err,
            method: req.method,
            path: req.originalUrl
        },
        "Unhandled error occurred"
    );

    const error = err instanceof HttpError ? err : undefined;

    const statusCode = error?.statusCode ?? 500;

    const message =
        statusCode === 500
            ? "Internal Server Error"
            : error?.message ?? "Unknown Error";

    const payload = error?.details != null
        ? { message, details: error.details }
        : { message };

    res.status(statusCode).json(payload);
};

export default errorHandler;
