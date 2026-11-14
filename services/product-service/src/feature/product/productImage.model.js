import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const ProductImage = sequelize.define(
    "ProductImage",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        productId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        imageUrl: {
            type: DataTypes.STRING,
            allowNull: false
        },

        isPrimary: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    },
    {
        tableName: "product_images",
        timestamps: true
    }
);

export default ProductImage;