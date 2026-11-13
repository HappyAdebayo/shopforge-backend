import sequelize from "../../config/db.js";
import Cart from "./cart.model.js";
import CartItem from "./cartItem.model.js";
import ProductReplica from "../product/productReplica.model.js";
import outboxService from "../../outbox-service/outbox.service.js";

class CartService {

    async getOrCreateCart(userId, transaction = null) {
        let cart = await Cart.findOne({
            where: {
                userId,
                status: "active"
            },
            transaction
        });

        if (!cart) {
            cart = await Cart.create(
                {
                    userId,
                    status: "active"
                },
                { transaction }
            );

            // Record outbox event for CartCreated
            await outboxService.createOutboxEvent(
                "CartCreated",
                {
                    cartId: cart.id,
                    userId: cart.userId
                },
                transaction
            );
        }

        return cart;
    }

    calculateSubtotal(items = []) {
        const subtotalNumber = items.reduce((sum, item) => {
            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 0;
            return sum + (price * quantity);
        }, 0);

        const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

        return {
            subtotal: Number(subtotalNumber.toFixed(2)),
            itemCount,
            totalUniqueItems: items.length
        };
    }

    async getCart(userId) {
        const cart = await this.getOrCreateCart(userId);

        const items = await CartItem.findAll({
            where: {
                cartId: cart.id
            },
            include: [
                {
                    model: ProductReplica,
                    as: "product",
                    attributes: ["id", "name", "price", "stock", "status", "imageUrl"]
                }
            ],
            order: [["createdAt", "ASC"]]
        });

        const formattedItems = items.map(item => {
            const itemObj = item.toJSON();
            const product = itemObj.product;
            const currentStock = product ? product.stock : null;
            const isAvailable = product ? product.status === "active" && product.stock > 0 : true;
            const hasSufficientStock = product ? product.stock >= item.quantity : true;
            const itemTotal = Number((Number(item.price) * item.quantity).toFixed(2));

            return {
                ...itemObj,
                itemTotal,
                availability: {
                    isAvailable,
                    hasSufficientStock,
                    availableStock: currentStock,
                    status: product ? product.status : "unknown",
                    currentPrice: product ? Number(product.price) : Number(item.price),
                    priceChanged: product ? Number(product.price) !== Number(item.price) : false
                }
            };
        });

        const { subtotal, itemCount, totalUniqueItems } = this.calculateSubtotal(formattedItems);

        const allValid = formattedItems.every(
            item => item.availability.isAvailable && item.availability.hasSufficientStock
        );

        return {
            id: cart.id,
            userId: cart.userId,
            status: cart.status,
            items: formattedItems,
            subtotal,
            itemCount,
            totalUniqueItems,
            isValid: allValid,
            updatedAt: cart.updatedAt
        };
    }

    async addItem(userId, { productId, quantity = 1 }) {
        const qty = Number(quantity);
        if (qty <= 0) {
            throw new Error("Quantity must be at least 1");
        }

        // Validate product availability from ProductReplica
        const product = await ProductReplica.findByPk(productId);
        if (product) {
            if (product.status !== "active") {
                throw new Error(`Product "${product.name}" is currently unavailable`);
            }
            if (product.stock < qty) {
                throw new Error(`Insufficient stock for "${product.name}". Only ${product.stock} available`);
            }
        }

        const transaction = await sequelize.transaction();

        try {
            const cart = await this.getOrCreateCart(userId, transaction);

            let cartItem = await CartItem.findOne({
                where: {
                    cartId: cart.id,
                    productId
                },
                transaction
            });

            if (cartItem) {
                const newQuantity = cartItem.quantity + qty;
                if (product && product.stock < newQuantity) {
                    throw new Error(`Cannot add ${qty} more. Only ${product.stock} in stock (currently ${cartItem.quantity} in cart)`);
                }

                cartItem.quantity = newQuantity;
                if (product) {
                    cartItem.price = product.price;
                    cartItem.name = product.name;
                    cartItem.imageUrl = product.imageUrl || cartItem.imageUrl;
                }
                await cartItem.save({ transaction });
            } else {
                cartItem = await CartItem.create(
                    {
                        cartId: cart.id,
                        productId,
                        name: product ? product.name : `Product #${productId}`,
                        price: product ? product.price : 0,
                        quantity: qty,
                        imageUrl: product ? product.imageUrl : null
                    },
                    { transaction }
                );
            }

            // Create Outbox Event
            await outboxService.createOutboxEvent(
                "CartItemAdded",
                {
                    userId,
                    cartId: cart.id,
                    itemId: cartItem.id,
                    productId: cartItem.productId,
                    quantity: cartItem.quantity,
                    price: Number(cartItem.price)
                },
                transaction
            );

            await transaction.commit();

            return await this.getCart(userId);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async updateQuantity(userId, itemIdOrProductId, quantity) {
        const qty = Number(quantity);
        if (isNaN(qty) || qty < 0) {
            throw new Error("Quantity must be 0 or a positive integer");
        }

        const transaction = await sequelize.transaction();

        try {
            const cart = await this.getOrCreateCart(userId, transaction);

            // Find item by CartItem.id or CartItem.productId
            let cartItem = await CartItem.findOne({
                where: {
                    cartId: cart.id,
                    id: itemIdOrProductId
                },
                transaction
            });

            if (!cartItem) {
                cartItem = await CartItem.findOne({
                    where: {
                        cartId: cart.id,
                        productId: itemIdOrProductId
                    },
                    transaction
                });
            }

            if (!cartItem) {
                throw new Error("Cart item not found");
            }

            if (qty === 0) {
                const removedItemId = cartItem.id;
                const removedProductId = cartItem.productId;

                await cartItem.destroy({ transaction });

                await outboxService.createOutboxEvent(
                    "CartItemRemoved",
                    {
                        userId,
                        cartId: cart.id,
                        itemId: removedItemId,
                        productId: removedProductId
                    },
                    transaction
                );

                await transaction.commit();
                return await this.getCart(userId);
            }

            // Check stock from replica
            const product = await ProductReplica.findByPk(cartItem.productId);
            if (product) {
                if (product.status !== "active") {
                    throw new Error(`Product "${product.name}" is no longer active`);
                }
                if (product.stock < qty) {
                    throw new Error(`Cannot update quantity to ${qty}. Only ${product.stock} available in stock`);
                }
                cartItem.price = product.price;
                cartItem.name = product.name;
                cartItem.imageUrl = product.imageUrl || cartItem.imageUrl;
            }

            cartItem.quantity = qty;
            await cartItem.save({ transaction });

            await outboxService.createOutboxEvent(
                "CartItemUpdated",
                {
                    userId,
                    cartId: cart.id,
                    itemId: cartItem.id,
                    productId: cartItem.productId,
                    quantity: cartItem.quantity,
                    price: Number(cartItem.price)
                },
                transaction
            );

            await transaction.commit();

            return await this.getCart(userId);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async removeItem(userId, itemIdOrProductId) {
        const transaction = await sequelize.transaction();

        try {
            const cart = await this.getOrCreateCart(userId, transaction);

            let cartItem = await CartItem.findOne({
                where: {
                    cartId: cart.id,
                    id: itemIdOrProductId
                },
                transaction
            });

            if (!cartItem) {
                cartItem = await CartItem.findOne({
                    where: {
                        cartId: cart.id,
                        productId: itemIdOrProductId
                    },
                    transaction
                });
            }

            if (!cartItem) {
                throw new Error("Cart item not found");
            }

            const removedId = cartItem.id;
            const removedProductId = cartItem.productId;

            await cartItem.destroy({ transaction });

            await outboxService.createOutboxEvent(
                "CartItemRemoved",
                {
                    userId,
                    cartId: cart.id,
                    itemId: removedId,
                    productId: removedProductId
                },
                transaction
            );

            await transaction.commit();

            return await this.getCart(userId);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async clearCart(userId) {
        const transaction = await sequelize.transaction();

        try {
            const cart = await this.getOrCreateCart(userId, transaction);

            await CartItem.destroy({
                where: {
                    cartId: cart.id
                },
                transaction
            });

            await outboxService.createOutboxEvent(
                "CartCleared",
                {
                    userId,
                    cartId: cart.id
                },
                transaction
            );

            await transaction.commit();

            return {
                id: cart.id,
                userId: cart.userId,
                status: cart.status,
                items: [],
                subtotal: 0,
                itemCount: 0,
                totalUniqueItems: 0,
                isValid: true
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async validateCart(userId) {
        const cart = await this.getOrCreateCart(userId);

        const items = await CartItem.findAll({
            where: {
                cartId: cart.id
            },
            include: [
                {
                    model: ProductReplica,
                    as: "product"
                }
            ]
        });

        const issues = [];
        const validatedItems = [];

        for (const item of items) {
            const product = item.product;
            const itemIssues = [];

            if (!product) {
                itemIssues.push({
                    type: "PRODUCT_NOT_FOUND",
                    message: `Product ID ${item.productId} is not found in the catalog`
                });
            } else {
                if (product.status !== "active") {
                    itemIssues.push({
                        type: "PRODUCT_INACTIVE",
                        message: `Product "${product.name}" is no longer available for purchase`
                    });
                }

                if (product.stock <= 0) {
                    itemIssues.push({
                        type: "OUT_OF_STOCK",
                        message: `Product "${product.name}" is out of stock`
                    });
                } else if (product.stock < item.quantity) {
                    itemIssues.push({
                        type: "INSUFFICIENT_STOCK",
                        message: `Only ${product.stock} units available for "${product.name}" (requested ${item.quantity})`,
                        availableStock: product.stock
                    });
                }

                if (Number(product.price) !== Number(item.price)) {
                    itemIssues.push({
                        type: "PRICE_CHANGED",
                        message: `Price for "${product.name}" has changed from $${item.price} to $${product.price}`,
                        oldPrice: Number(item.price),
                        newPrice: Number(product.price)
                    });
                }
            }

            if (itemIssues.length > 0) {
                issues.push(...itemIssues);
            }

            validatedItems.push({
                itemId: item.id,
                productId: item.productId,
                name: item.name,
                requestedQuantity: item.quantity,
                cartPrice: Number(item.price),
                currentPrice: product ? Number(product.price) : Number(item.price),
                availableStock: product ? product.stock : 0,
                status: product ? product.status : "not_found",
                isAvailable: product ? product.status === "active" && product.stock >= item.quantity : false,
                issues: itemIssues
            });
        }

        const { subtotal, itemCount } = this.calculateSubtotal(items);

        return {
            cartId: cart.id,
            isValid: issues.length === 0,
            hasIssues: issues.length > 0,
            issueCount: issues.length,
            issues,
            items: validatedItems,
            subtotal,
            itemCount
        };
    }
}

export default new CartService();
