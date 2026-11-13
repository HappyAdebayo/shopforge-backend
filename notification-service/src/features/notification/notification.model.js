import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const Notification = sequelize.define(
    "Notification",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        type: {
            type: DataTypes.STRING,
            allowNull: false
        },

        title: {
            type: DataTypes.STRING,
            allowNull: false
        },

        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        referenceId: {
            type: DataTypes.STRING,
            allowNull: true
        },

        isRead: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    },
    {
        tableName: "notifications",
        timestamps: true
    }
);

export default Notification;
