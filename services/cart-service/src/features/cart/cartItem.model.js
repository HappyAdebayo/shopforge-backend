import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const CartItem = sequelize.define(
    "CartItem",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        cartId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        productId: {
            type: DataTypes.INTEGER,
            allowNull: false
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

        imageUrl: {
            type: DataTypes.STRING,
            allowNull: true
        }
    },
    {
        tableName: "cart_items",
        timestamps: true
    }
);

export default CartItem;
