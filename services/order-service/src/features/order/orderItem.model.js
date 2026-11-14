import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const OrderItem = sequelize.define(
    "OrderItem",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        orderId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        productId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        vendorId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false
        },

        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },

        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },

        subtotal: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },

        imageUrl: {
            type: DataTypes.STRING,
            allowNull: true
        }
    },
    {
        tableName: "order_items",
        timestamps: true
    }
);

export default OrderItem;
