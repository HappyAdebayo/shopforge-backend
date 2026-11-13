import { Op } from "sequelize";
import sequelize from "../../config/db.js";
import Order from "./order.model.js";
import OrderItem from "./orderItem.model.js";
import ProductReplica from "../product/productReplica.model.js";
import outboxService from "../../outbox-service/outbox.service.js";

class OrderService {

    generateOrderNumber() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `ORD-${timestamp}-${randomPart}`;
    }

    async createOrder(userId, data) {
        const {
            items = [],
            customerEmail,
            customerName = null,
            currency = "NGN",
            tax = 0.00,
            shippingFee = 0.00,
            shippingAddress = null,
            paymentProvider = "mock",
            notes = null
        } = data;

        if (!items || items.length === 0) {
            throw new Error("Order must contain at least one item");
        }

        // Validate items and resolve product information
        const resolvedItems = [];
        let calculatedSubtotal = 0;

        for (const item of items) {
            const product = await ProductReplica.findByPk(item.productId);

            if (product) {
                if (product.status !== "active") {
                    throw new Error(`Product "${product.name}" is no longer available`);
                }
                if (product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for "${product.name}". Only ${product.stock} available`);
                }
            }

            const unitPrice = product ? Number(product.price) : Number(item.price || 0);
            const itemName = product ? product.name : (item.name || `Product #${item.productId}`);
            const itemImage = product ? (product.imageUrl || item.imageUrl) : item.imageUrl;
            const vendorId = product ? product.vendorId : null;
            const quantity = Number(item.quantity);
            const itemSubtotal = Number((unitPrice * quantity).toFixed(2));

            calculatedSubtotal += itemSubtotal;

            resolvedItems.push({
                productId: item.productId,
                vendorId,
                name: itemName,
                price: unitPrice,
                quantity,
                subtotal: itemSubtotal,
                imageUrl: itemImage
            });
        }

        calculatedSubtotal = Number(calculatedSubtotal.toFixed(2));
        const numTax = Number(Number(tax || 0).toFixed(2));
        const numShipping = Number(Number(shippingFee || 0).toFixed(2));
        const calculatedTotal = Number((calculatedSubtotal + numTax + numShipping).toFixed(2));

        const orderNumber = this.generateOrderNumber();
        const stringifiedAddress = typeof shippingAddress === "object"
            ? JSON.stringify(shippingAddress)
            : shippingAddress;

        // Best-effort stock reservation in Product Service under a row-level lock.
        // If the product-service is unreachable or returns an error, we log and continue
        // so a temporary service hiccup never blocks the customer from placing an order.
        const productServiceUrl = process.env.PRODUCT_SERVICE_URL || "http://localhost:3003";
        let stockReserved = false;

        if (process.env.NODE_ENV !== "test" || process.env.ENABLE_PRODUCT_SERVICE_CALLS === "true") {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

                const reserveRes = await fetch(`${productServiceUrl}/products/reserve`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal,
                    body: JSON.stringify({
                        orderNumber,
                        items: items.map(i => ({ productId: i.productId, quantity: i.quantity }))
                    })
                });

                clearTimeout(timeout);

                if (reserveRes.ok) {
                    stockReserved = true;
                    console.log(`[Order Service] Stock reserved for order ${orderNumber}`);
                } else {
                    const reserveData = await reserveRes.json().catch(() => ({}));
                    // Throw only on hard stock errors (insufficient stock, product not found)
                    // so customers see a meaningful message
                    const msg = reserveData.message || "Stock reservation failed";
                    if (msg.toLowerCase().includes("insufficient") || msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("not active")) {
                        throw new Error(msg);
                    }
                    console.warn(`[Order Service] Stock reservation returned non-OK (${reserveRes.status}): ${msg}. Continuing order creation.`);
                }
            } catch (reserveError) {
                if (reserveError.name === "AbortError") {
                    console.warn("[Order Service] Stock reservation timed out. Continuing order creation.");
                } else if (reserveError.code === "ECONNREFUSED" || reserveError.cause?.code === "ECONNREFUSED") {
                    console.warn("[Order Service] Product service unreachable for stock reservation. Continuing order creation.");
                } else {
                    // Re-throw meaningful stock errors (insufficient stock, etc.)
                    throw reserveError;
                }
            }
        }

        const transaction = await sequelize.transaction();

        try {
            const order = await Order.create(
                {
                    orderNumber,
                    userId,
                    customerEmail: customerEmail || `user-${userId}@shopforge.internal`,
                    customerName,
                    status: "pending",
                    currency,
                    subtotal: calculatedSubtotal,
                    tax: numTax,
                    shippingFee: numShipping,
                    totalAmount: calculatedTotal,
                    shippingAddress: stringifiedAddress,
                    paymentProvider,
                    notes
                },
                { transaction }
            );

            const createdOrderItems = await OrderItem.bulkCreate(
                resolvedItems.map(item => ({
                    ...item,
                    orderId: order.id
                })),
                { transaction }
            );

            // Record transactional Outbox event for OrderCreated
            await outboxService.createOutboxEvent(
                "OrderCreated",
                {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    userId: order.userId,
                    customerEmail: order.customerEmail,
                    customerName: order.customerName,
                    status: order.status,
                    currency: order.currency,
                    subtotal: Number(order.subtotal),
                    tax: Number(order.tax),
                    shippingFee: Number(order.shippingFee),
                    totalAmount: Number(order.totalAmount),
                    paymentProvider: order.paymentProvider,
                    shippingAddress: order.shippingAddress,
                    items: createdOrderItems.map(i => ({
                        id: i.id,
                        productId: i.productId,
                        vendorId: i.vendorId,
                        name: i.name,
                        price: Number(i.price),
                        quantity: i.quantity,
                        subtotal: Number(i.subtotal),
                        imageUrl: i.imageUrl
                    }))
                },
                transaction
            );

            await transaction.commit();

            return await this.getOrder(order.id);
        } catch (error) {
            await transaction.rollback();

            // Compensation action: release reserved stock if internal order creation failed
            if (stockReserved) {
                try {
                    await fetch(`${productServiceUrl}/products/release`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            orderNumber,
                            items: items.map(i => ({ productId: i.productId, quantity: i.quantity }))
                        })
                    });
                } catch (relErr) {
                    console.error("[Order Service] Failed to auto-release reserved stock:", relErr.message);
                }
            }

            throw error;
        }
    }

    async getOrder(idOrNumber, requestingUserId = null, userRole = "user") {
        const isNumeric = !isNaN(Number(idOrNumber));
        const whereClause = isNumeric
            ? { [Op.or]: [{ id: Number(idOrNumber) }, { orderNumber: String(idOrNumber) }] }
            : { orderNumber: String(idOrNumber) };

        const order = await Order.findOne({
            where: whereClause,
            include: [
                {
                    model: OrderItem,
                    as: "items"
                }
            ]
        });

        if (!order) {
            throw new Error("Order not found");
        }

        if (requestingUserId && userRole !== "admin" && order.userId !== requestingUserId) {
            throw new Error("Unauthorized to access this order");
        }

        const orderObj = order.toJSON();
        if (orderObj.shippingAddress) {
            try {
                orderObj.shippingAddress = JSON.parse(orderObj.shippingAddress);
            } catch (e) {
                // leave as string
            }
        }

        return orderObj;
    }

    async getUserOrders(userId, { page = 1, limit = 20, status = null } = {}) {
        const offset = (page - 1) * limit;
        const where = { userId };

        if (status) {
            where.status = status;
        }

        const { count, rows } = await Order.findAndCountAll({
            where,
            distinct: true,
            include: [
                {
                    model: OrderItem,
                    as: "items"
                }
            ],
            order: [["createdAt", "DESC"]],
            limit,
            offset
        });

        const formattedRows = rows.map(order => {
            const obj = order.toJSON();
            if (obj.shippingAddress) {
                try {
                    obj.shippingAddress = JSON.parse(obj.shippingAddress);
                } catch (e) {}
            }
            return obj;
        });

        return {
            orders: formattedRows,
            pagination: {
                totalItems: count,
                currentPage: Number(page),
                itemsPerPage: Number(limit),
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    async getAllOrders({ page = 1, limit = 20, status = null, search = null } = {}) {
        const offset = (page - 1) * limit;
        const where = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where[Op.or] = [
                { orderNumber: { [Op.like]: `%${search}%` } },
                { customerEmail: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Order.findAndCountAll({
            where,
            distinct: true,
            include: [
                {
                    model: OrderItem,
                    as: "items"
                }
            ],
            order: [["createdAt", "DESC"]],
            limit,
            offset
        });

        return {
            orders: rows,
            pagination: {
                totalItems: count,
                currentPage: Number(page),
                itemsPerPage: Number(limit),
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    async updateOrderStatus(orderId, status, notes = null) {
        const transaction = await sequelize.transaction();

        try {
            const order = await Order.findByPk(orderId, { transaction });

            if (!order) {
                throw new Error("Order not found");
            }

            const previousStatus = order.status;
            order.status = status;
            if (notes) {
                order.notes = notes;
            }

            await order.save({ transaction });

            await outboxService.createOutboxEvent(
                "OrderStatusUpdated",
                {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    userId: order.userId,
                    previousStatus,
                    newStatus: order.status,
                    notes
                },
                transaction
            );

            await transaction.commit();

            return await this.getOrder(order.id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async cancelOrder(orderId, userId = null, reason = null) {
        const transaction = await sequelize.transaction();

        try {
            const order = await Order.findByPk(orderId, {
                include: [{ model: OrderItem, as: "items" }],
                transaction
            });

            if (!order) {
                throw new Error("Order not found");
            }

            if (userId && order.userId !== userId) {
                throw new Error("Unauthorized to cancel this order");
            }

            if (order.status === "shipped" || order.status === "delivered") {
                throw new Error(`Cannot cancel order in "${order.status}" status`);
            }

            if (order.status === "cancelled") {
                throw new Error("Order is already cancelled");
            }

            order.status = "cancelled";
            if (reason) {
                order.notes = order.notes ? `${order.notes} | Cancellation Reason: ${reason}` : `Cancellation Reason: ${reason}`;
            }

            await order.save({ transaction });

            await outboxService.createOutboxEvent(
                "OrderCancelled",
                {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    userId: order.userId,
                    reason,
                    items: (order.items || []).map(i => ({
                        productId: i.productId,
                        vendorId: i.vendorId,
                        name: i.name,
                        quantity: i.quantity
                    }))
                },
                transaction
            );

            await transaction.commit();

            return await this.getOrder(order.id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async handlePaymentSuccessful(paymentData) {
        const { orderId, reference, provider, transactionId } = paymentData;
        const transaction = await sequelize.transaction();

        try {
            const order = await Order.findByPk(orderId, {
                include: [{ model: OrderItem, as: "items" }],
                transaction
            });

            if (!order) {
                console.warn(`[Order Service] Order ${orderId} not found for successful payment`);
                await transaction.rollback();
                return;
            }

            order.status = "confirmed";
            await order.save({ transaction });

            await outboxService.createOutboxEvent(
                "OrderConfirmed",
                {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    userId: order.userId,
                    customerEmail: order.customerEmail,
                    totalAmount: Number(order.totalAmount),
                    paymentReference: reference,
                    provider,
                    transactionId,
                    items: (order.items || []).map(i => ({
                        productId: i.productId,
                        vendorId: i.vendorId,
                        name: i.name,
                        quantity: i.quantity,
                        price: Number(i.price),
                        subtotal: Number(i.subtotal)
                    }))
                },
                transaction
            );

            await transaction.commit();
            console.log(`[Order Service] Order ${order.id} (${order.orderNumber}) status updated to "confirmed"`);
        } catch (error) {
            await transaction.rollback();
            console.error(`[Order Service] Error confirming order ${orderId}:`, error.message);
        }
    }

    async handlePaymentFailed(paymentData) {
        const { orderId, reference, reason } = paymentData;
        const transaction = await sequelize.transaction();

        try {
            const order = await Order.findByPk(orderId, {
                include: [{ model: OrderItem, as: "items" }],
                transaction
            });

            if (!order) {
                console.warn(`[Order Service] Order ${orderId} not found for failed payment`);
                await transaction.rollback();
                return;
            }

            order.status = "payment_failed";
            order.notes = order.notes ? `${order.notes} | Payment Failed: ${reason || "Unspecified"}` : `Payment Failed: ${reason || "Unspecified"}`;
            await order.save({ transaction });

            await outboxService.createOutboxEvent(
                "OrderPaymentFailed",
                {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    userId: order.userId,
                    customerEmail: order.customerEmail,
                    paymentReference: reference,
                    reason,
                    items: (order.items || []).map(i => ({
                        productId: i.productId,
                        vendorId: i.vendorId,
                        name: i.name,
                        quantity: i.quantity
                    }))
                },
                transaction
            );

            await transaction.commit();
            console.log(`[Order Service] Order ${order.id} (${order.orderNumber}) status updated to "payment_failed"`);
        } catch (error) {
            await transaction.rollback();
            console.error(`[Order Service] Error marking order ${orderId} as payment_failed:`, error.message);
        }
    }
}

export default new OrderService();
