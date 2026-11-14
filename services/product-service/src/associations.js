import Product from "./feature/product/product.model.js";
import ProductImage from "./feature/product/productImage.model.js";
import StockReservation from "./feature/product/stockReservation.model.js";

Product.hasMany(ProductImage, {
    foreignKey: "productId",
    as: "images"
});

ProductImage.belongsTo(Product, {
    foreignKey: "productId",
    as: "product"
});

Product.hasMany(StockReservation, {
    foreignKey: "productId",
    as: "reservations"
});

StockReservation.belongsTo(Product, {
    foreignKey: "productId",
    as: "product"
});

import Review from "./feature/review/review.model.js";

Product.hasMany(Review, {
    foreignKey: "productId",
    as: "reviews"
});

Review.belongsTo(Product, {
    foreignKey: "productId",
    as: "product"
});

import Interaction from "./feature/interaction/interaction.model.js";

Product.hasMany(Interaction, {
    foreignKey: "productId",
    as: "interactions"
});

Interaction.belongsTo(Product, {
    foreignKey: "productId",
    as: "product"
});