import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const Cart = sequelize.define(
    "Cart",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true
        },

        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "active"
        }
    },
    {
        tableName: "carts",
        timestamps: true
    }
);

export default Cart;
