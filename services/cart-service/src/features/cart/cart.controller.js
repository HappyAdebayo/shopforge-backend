import cartService from "./cart.service.js";
import cartValidation from "./cart.validation.js";

class CartController {

    async getCart(req, res) {
        try {
            const userId = req.user.id;
            const cart = await cartService.getCart(userId);

            return res.status(200).json({
                message: "Cart retrieved successfully",
                data: cart
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }
    }

    async addItem(req, res) {
        try {
            const { error, value } = cartValidation.addItem(req.body);

            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const userId = req.user.id;
            const cart = await cartService.addItem(userId, value);

            return res.status(201).json({
                message: "Product added to cart successfully",
                data: cart
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }
    }

    async updateQuantity(req, res) {
        try {
            const { id } = req.params;
            const { error: idError } = cartValidation.itemId(id);
            if (idError) {
                return res.status(400).json({
                    message: idError.details[0].message
                });
            }

            const { error, value } = cartValidation.updateQuantity(req.body);
            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const userId = req.user.id;
            const cart = await cartService.updateQuantity(userId, Number(id), value.quantity);

            return res.status(200).json({
                message: "Cart item updated successfully",
                data: cart
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }
    }

    async removeItem(req, res) {
        try {
            const { id } = req.params;
            const { error: idError } = cartValidation.itemId(id);
            if (idError) {
                return res.status(400).json({
                    message: idError.details[0].message
                });
            }

            const userId = req.user.id;
            const cart = await cartService.removeItem(userId, Number(id));

            return res.status(200).json({
                message: "Item removed from cart successfully",
                data: cart
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }
    }

    async clearCart(req, res) {
        try {
            const userId = req.user.id;
            const cart = await cartService.clearCart(userId);

            return res.status(200).json({
                message: "Cart cleared successfully",
                data: cart
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }
    }

    async getSubtotal(req, res) {
        try {
            const userId = req.user.id;
            const cart = await cartService.getCart(userId);

            return res.status(200).json({
                message: "Cart subtotal calculated successfully",
                data: {
                    cartId: cart.id,
                    subtotal: cart.subtotal,
                    itemCount: cart.itemCount,
                    totalUniqueItems: cart.totalUniqueItems
                }
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }
    }

    async validateCart(req, res) {
        try {
            const userId = req.user.id;
            const validation = await cartService.validateCart(userId);

            return res.status(200).json({
                message: validation.isValid
                    ? "All cart products are available and valid"
                    : "Some items in the cart require your attention",
                data: validation
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }
    }
}

export default new CartController();
