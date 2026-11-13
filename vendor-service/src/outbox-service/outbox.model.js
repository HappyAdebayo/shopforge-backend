import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const OutboxEvent = sequelize.define(
    "OutboxEvent",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        eventType: {
            type: DataTypes.STRING,
            allowNull: false
        },

        payload: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "pending"
        },

        processedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    },
    {
        tableName: "outbox_events",
        timestamps: true
    }
);

export default OutboxEvent;