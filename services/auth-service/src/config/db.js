import { Sequelize } from "sequelize";
import logger from "./logger.js"

class DatabaseConnection {
    static instance = null;

    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new Sequelize({
                dialect: process.env.DB_DIALECT || "sqlite",
                storage: process.env.DB_STORAGE || "./database.sqlite",
                logging: process.env.DB_LOGGING === "true"
                    ? (message) => logger.debug({ sql: message }, "Database query")
                    : false,
                pool: {
                    max: parseInt(process.env.DB_POOL_MAX || "10", 10),
                    min: parseInt(process.env.DB_POOL_MIN || "0", 10),
                    acquire: parseInt(process.env.DB_POOL_ACQUIRE || "30000", 10),
                    idle: parseInt(process.env.DB_POOL_IDLE || "10000", 10)
                }
            });
        }
        return DatabaseConnection.instance;
    }
}

// Singleton database instance shared across the application lifecycle
const sequelize = DatabaseConnection.getInstance();

export { DatabaseConnection };
export default sequelize;
