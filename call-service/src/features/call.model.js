import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Call = sequelize.define(
    "Call",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        callerId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        vendorId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        callerName: {
            type: DataTypes.STRING,
            allowNull: true
        },

        vendorName: {
            type: DataTypes.STRING,
            allowNull: true
        },

        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "ringing"
        },

        startedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },

        endedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    },
    {
        tableName: "calls",
        timestamps: true
    }
);

export default Call;