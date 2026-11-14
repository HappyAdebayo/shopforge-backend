import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const StockReservation = sequelize.define(
    "StockReservation",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        orderId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        orderNumber: {
            type: DataTypes.STRING,
            allowNull: true
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "reserved" // "reserved" | "confirmed" | "released" | "expired"
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false
        }
    },
    {
        tableName: "stock_reservations",
        timestamps: true
    }
);

export default StockReservation;
