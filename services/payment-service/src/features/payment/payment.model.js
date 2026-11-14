import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const Payment = sequelize.define(
    "Payment",
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

        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },

        currency: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "USD"
        },

        reference: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },

        provider: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "mock"
        },

        providerTransactionId: {
            type: DataTypes.STRING,
            allowNull: true
        },

        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "pending",
            validate: {
                isIn: [["pending", "successful", "failed", "refunded"]]
            }
        },

        paymentMethod: {
            type: DataTypes.STRING,
            allowNull: true
        },

        customerEmail: {
            type: DataTypes.STRING,
            allowNull: true
        },

        metadata: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        checkoutUrl: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        paidAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    },
    {
        tableName: "payments",
        timestamps: true
    }
);

export default Payment;
