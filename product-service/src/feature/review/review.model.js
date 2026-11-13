import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const Review = sequelize.define(
    "Review",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "products",
                key: "id"
            },
            onDelete: "CASCADE"
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        userName: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "Customer"
        },
        userEmail: {
            type: DataTypes.STRING,
            allowNull: true
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            }
        },
        title: {
            type: DataTypes.STRING(150),
            allowNull: true
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "approved"
        }
    },
    {
        tableName: "product_reviews",
        timestamps: true,
        indexes: [
            {
                fields: ["productId"]
            },
            {
                unique: true,
                fields: ["productId", "userId"]
            }
        ]
    }
);

export default Review;
