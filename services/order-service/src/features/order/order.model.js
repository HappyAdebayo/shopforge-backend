import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const Order = sequelize.define(
    "Order",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        orderNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },

        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        customerEmail: {
            type: DataTypes.STRING,
            allowNull: false
        },

        customerName: {
            type: DataTypes.STRING,
            allowNull: true
        },

        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "pending",
            validate: {
                isIn: [[
                    "pending",
                    "confirmed",
                    "processing",
                    "shipped",
                    "delivered",
                    "cancelled",
                    "payment_failed"
                ]]
            }
        },

        currency: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "USD"
        },

        subtotal: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },

        tax: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },

        shippingFee: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },

        totalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },

        shippingAddress: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        paymentProvider: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "mock"
        },

        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "orders",
        timestamps: true
    }
);

export default Order;
