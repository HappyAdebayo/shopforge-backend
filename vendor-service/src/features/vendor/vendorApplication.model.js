import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const VendorApplication = sequelize.define(
    "VendorApplication",
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
            defaultValue: "pending"
        }
    },
    {
        tableName: "vendor_applications",
        timestamps: true
    }
);

export default VendorApplication;