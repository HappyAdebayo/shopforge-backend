import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const AdminUser = sequelize.define(
    "AdminUser",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },
    {
        tableName: "admin_users_replica",
        timestamps: true
    }
);

export default AdminUser;