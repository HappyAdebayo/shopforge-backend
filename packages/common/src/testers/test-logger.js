
import { createLogger } from "../index.js";

const logger = createLogger("auth-service");

logger.info("Auth service started");
logger.warn("This is a warning");
logger.error("This is an error");
logger.debug("This is a debug message");
