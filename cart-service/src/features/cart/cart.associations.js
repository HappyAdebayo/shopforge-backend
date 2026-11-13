import Cart from "./cart.model.js";
import CartItem from "./cartItem.model.js";
import ProductReplica from "../product/productReplica.model.js";

Cart.hasMany(CartItem, {
    foreignKey: "cartId",
    as: "items",
    onDelete: "CASCADE"
});

CartItem.belongsTo(Cart, {
    foreignKey: "cartId",
    as: "cart"
});

CartItem.belongsTo(ProductReplica, {
    foreignKey: "productId",
    as: "product"
});

export default {
    Cart,
    CartItem,
    ProductReplica
};
