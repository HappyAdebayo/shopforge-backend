import orderService from "./order.service.js";
import orderValidation from "./order.validation.js";

class OrderController {

    async create(req, res) {
        try {
            const { error, value } = orderValidation.create(req.body);
            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const userId = req.user.id;
            const customerEmail = req.body.customerEmail || req.user.email;
            const customerName = req.body.customerName || req.user.name;

            const order = await orderService.createOrder(userId, {
                ...value,
                customerEmail,
                customerName
            });

            return res.status(201).json({
                message: "Order created successfully",
                data: order
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }
    }

    async index(req, res) {
        try {
            const { page, limit, status, search, all } = req.query;
            const userId = req.user.id;
            const userRole = req.user.role;

            if (userRole === "admin" && all === "true") {
                const result = await orderService.getAllOrders({
                    page: Number(page) || 1,
                    limit: Number(limit) || 20,
                    status,
                    search
                });
                return res.status(200).json({
                    message: "All orders retrieved successfully",
                    data: result
                });
            }

            const result = await orderService.getUserOrders(userId, {
                page: Number(page) || 1,
                limit: Number(limit) || 20,
                status
            });

            return res.status(200).json({
                message: "User orders retrieved successfully",
                data: result
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;
            const { error } = orderValidation.orderId(id);
            if (error) {
                return res.status(400).json({
                    message: "Invalid order ID or number"
                });
            }

            const userId = req.user.id;
            const userRole = req.user.role;

            const order = await orderService.getOrder(id, userId, userRole);

            return res.status(200).json({
                message: "Order retrieved successfully",
                data: order
            });
        } catch (error) {
            return res.status(404).json({
                message: error.message
            });
        }
    }

    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { error, value } = orderValidation.updateStatus(req.body);
            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const order = await orderService.updateOrderStatus(id, value.status, value.notes);

            return res.status(200).json({
                message: "Order status updated successfully",
                data: order
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }
    }

    async cancel(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const userId = req.user.role === "admin" ? null : req.user.id;

            const order = await orderService.cancelOrder(id, userId, reason);

            return res.status(200).json({
                message: "Order cancelled successfully",
                data: order
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }
    }
}

export default new OrderController();
