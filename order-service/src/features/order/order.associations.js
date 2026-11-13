import Order from "./order.model.js";
import OrderItem from "./orderItem.model.js";
import ProductReplica from "../product/productReplica.model.js";

Order.hasMany(OrderItem, {
    foreignKey: "orderId",
    as: "items",
    onDelete: "CASCADE"
});

OrderItem.belongsTo(Order, {
    foreignKey: "orderId",
    as: "order"
});

OrderItem.belongsTo(ProductReplica, {
    foreignKey: "productId",
    as: "product"
});

export default {
    Order,
    OrderItem,
    ProductReplica
};
