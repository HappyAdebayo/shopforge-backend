import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const Refund = sequelize.define(
    "Refund",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        paymentId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        reference: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },

        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },

        reason: {
            type: DataTypes.STRING,
            allowNull: true
        },

        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "pending",
            validate: {
                isIn: [["pending", "completed", "failed"]]
            }
        }
    },
    {
        tableName: "refunds",
        timestamps: true
    }
);

export default Refund;
