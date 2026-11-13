import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const ProductReplica = sequelize.define(
    "ProductReplica",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: false
        },

        vendorId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },

        categoryId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },

        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },

        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "active"
        },

        imageUrl: {
            type: DataTypes.STRING,
            allowNull: true
        }
    },
    {
        tableName: "product_replicas",
        timestamps: true
    }
);

export default ProductReplica;
