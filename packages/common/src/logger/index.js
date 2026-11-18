
import pino from "pino";

const createLogger = (serviceName) => {
    if (!serviceName) {
        throw new Error("A service name is required to create a logger");
    }

    return pino({
        level: process.env.LOG_LEVEL || "info",

        base: {
            service: serviceName
        },

        timestamp: pino.stdTimeFunctions.isoTime
    });
};

export default createLogger;
