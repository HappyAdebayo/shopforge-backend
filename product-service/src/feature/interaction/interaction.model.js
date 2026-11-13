import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const VALID_EVENTS = ["view", "addtocart", "transaction"];

const Interaction = sequelize.define(
    "Interaction",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "user_id"
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "product_id",
            references: {
                model: "products",
                key: "id"
            },
            onDelete: "CASCADE"
        },
        event: {
            type: DataTypes.ENUM(...VALID_EVENTS),
            allowNull: false,
            field: "event",
            validate: {
                isIn: {
                    args: [VALID_EVENTS],
                    msg: "Event must be one of 'view', 'addtocart', or 'transaction'"
                }
            }
        },
        timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "timestamp"
        }
    },
    {
        tableName: "product_interactions",
        timestamps: false,
        indexes: [
            {
                name: "idx_interactions_user_id",
                fields: ["user_id"]
            },
            {
                name: "idx_interactions_product_id",
                fields: ["product_id"]
            },
            {
                name: "idx_interactions_event",
                fields: ["event"]
            },
            {
                name: "idx_interactions_user_product",
                fields: ["user_id", "product_id"]
            },
            {
                name: "idx_interactions_timestamp",
                fields: ["timestamp"]
            }
        ]
    }
);

export { VALID_EVENTS };
export default Interaction;
