import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const Vendor = sequelize.define(
    "Vendor",
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

        businessName: {
            type: DataTypes.STRING,
            allowNull: false
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        logoUrl: {
            type: DataTypes.STRING,
            allowNull: true
        },

        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "active"
        }
    },
    {
        tableName: "vendors",
        timestamps: true
    }
);

export default Vendor;