import { Op } from "sequelize";
import sequelize from "../../config/db.js";

import Product from "./product.model.js";
import ProductImage from "./productImage.model.js";
import StockReservation from "./stockReservation.model.js";
import Category from "../category/category.model.js";
import outboxService from "../../outbox-service/outbox.service.js";

class ProductService {

    async create(data) {
        const category = await Category.findOne({
            where: {
                id: data.categoryId,
                status: "active"
            }
        });

        if (!category) {
            throw new Error("Category not found");
        }

        const transaction = await sequelize.transaction();

        try {
            const product = await Product.create(
                {
                    vendorId: data.vendorId,
                    categoryId: data.categoryId,
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    stock: data.stock
                },
                {
                    transaction
                }
            );

            await ProductImage.bulkCreate(
                data.images.map((image) => ({
                    productId: product.id,
                    imageUrl: image.imageUrl,
                    isPrimary: image.isPrimary || false
                })),
                {
                    transaction
                }
            );

            const primaryImage = data.images.find(img => img.isPrimary)?.imageUrl || data.images[0]?.imageUrl || null;

            // Create Outbox Event for ProductCreated
            await outboxService.createOutboxEvent(
                "ProductCreated",
                {
                    id: product.id,
                    vendorId: product.vendorId,
                    categoryId: product.categoryId,
                    name: product.name,
                    description: product.description,
                    price: Number(product.price),
                    stock: Number(product.stock),
                    status: product.status,
                    imageUrl: primaryImage,
                    images: data.images
                },
                transaction
            );

            await transaction.commit();

            return await Product.findByPk(
                product.id,
                {
                    include: [
                        {
                            model: ProductImage,
                            as: "images"
                        }
                    ]
                }
            );

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async getAll({ categoryId, search, page = 1, limit = 20 }) {
        const offset = (page - 1) * limit;

        const where = {
            status: "active"
        };

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (search) {
            where.name = {
                [Op.like]: `%${search}%`
            };
        }

        const { count, rows } = await Product.findAndCountAll({
            where,
            distinct: true,
            include: [
                {
                    model: ProductImage,
                    as: "images"
                }
            ],
            order: [
                ["createdAt", "DESC"]
            ],
            limit,
            offset
        });

        return {
            products: rows,
            pagination: {
                totalItems: count,
                currentPage: page,
                itemsPerPage: limit,
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    async getById(id) {
        const product = await Product.findByPk(
            id,
            {
                include: [
                    {
                        model: ProductImage,
                        as: "images"
                    }
                ]
            }
        );

        if (!product) {
            throw new Error("Product not found");
        }

        return product;
    }

    async update(id, data) {
        const transaction = await sequelize.transaction();

        try {
            const product = await Product.findByPk(
                id,
                {
                    transaction
                }
            );

            if (!product) {
                throw new Error("Product not found");
            }

            await product.update(
                {
                    categoryId: data.categoryId,
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    stock: data.stock
                },
                {
                    transaction
                }
            );

            let primaryImage = null;
            if (data.images) {
                await ProductImage.destroy({
                    where: {
                        productId: product.id
                    },
                    transaction
                });

                await ProductImage.bulkCreate(
                    data.images.map((image) => ({
                        productId: product.id,
                        imageUrl: image.imageUrl,
                        isPrimary: image.isPrimary || false
                    })),
                    {
                        transaction
                    }
                );
                primaryImage = data.images.find(img => img.isPrimary)?.imageUrl || data.images[0]?.imageUrl || null;
            }

            // Create Outbox Event for ProductUpdated
            await outboxService.createOutboxEvent(
                "ProductUpdated",
                {
                    id: product.id,
                    vendorId: product.vendorId,
                    categoryId: product.categoryId,
                    name: product.name,
                    description: product.description,
                    price: Number(product.price),
                    stock: Number(product.stock),
                    status: product.status,
                    imageUrl: primaryImage,
                    images: data.images
                },
                transaction
            );

            await transaction.commit();

            return await Product.findByPk(
                product.id,
                {
                    include: [
                        {
                            model: ProductImage,
                            as: "images"
                        }
                    ]
                }
            );

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async delete(id) {
        const transaction = await sequelize.transaction();

        try {
            const product = await Product.findByPk(id, { transaction });

            if (!product) {
                throw new Error("Product not found");
            }

            if (product.status === "inactive") {
                throw new Error("Product is already inactive");
            }

            product.status = "inactive";
            await product.save({ transaction });

            // Create Outbox Event for ProductDeleted
            await outboxService.createOutboxEvent(
                "ProductDeleted",
                {
                    id: product.id,
                    status: "inactive"
                },
                transaction
            );

            await transaction.commit();

            return product;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async getProductCount() {
        const count = await Product.count({
            where: {
                status: "active"
            }
        });

        return count;
    }

    async getVendorProducts(vendorId, { page = 1, limit = 20 }) {
        const offset = (page - 1) * limit;

        const { count, rows } = await Product.findAndCountAll({
            where: {
                vendorId,
                status: "active"
            },
            distinct: true,
            include: [
                {
                    model: ProductImage,
                    as: "images"
                }
            ],
            order: [
                ["createdAt", "DESC"]
            ],
            limit,
            offset
        });

        return {
            products: rows,
            pagination: {
                totalItems: count,
                currentPage: page,
                itemsPerPage: limit,
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * Concurrency-safe stock reservation combining row-level locking (transaction.LOCK.UPDATE)
     * with an atomic database-level stock update (WHERE stock >= requestedQty)
     * and recording an audit entry in the `stock_reservations` table.
     */
    async reserveStock(params = {}) {
        // Support either an items array directly or an options object { orderId, orderNumber, items, holdMinutes }
        const isArray = Array.isArray(params);
        const items = isArray ? params : (params.items || []);
        const orderId = isArray ? null : params.orderId;
        const orderNumber = isArray ? null : params.orderNumber;
        const holdMinutes = (params && params.holdMinutes) ? Number(params.holdMinutes) : 15;

        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("No items provided for stock reservation");
        }

        const expiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);
        const transaction = await sequelize.transaction();

        try {
            const reservedItems = [];

            for (const item of items) {
                // 1. Acquire row-level lock inside the transaction
                const product = await Product.findByPk(item.productId, {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                if (!product) {
                    throw new Error(`Product with ID ${item.productId} not found`);
                }

                if (product.status !== "active") {
                    throw new Error(`Product "${product.name}" is no longer active`);
                }

                const requestedQty = Number(item.quantity);

                // 2. Atomic database update with safety predicate (stock >= requestedQty)
                const [affectedRows] = await Product.update(
                    {
                        stock: sequelize.literal(`stock - ${requestedQty}`)
                    },
                    {
                        where: {
                            id: item.productId,
                            status: "active",
                            stock: {
                                [Op.gte]: requestedQty
                            }
                        },
                        transaction
                    }
                );

                if (affectedRows === 0) {
                    throw new Error(
                        `Insufficient stock for "${product.name}". Requested: ${requestedQty}, Available: ${product.stock}`
                    );
                }

                // 3. Reload locked instance to get exact new stock after atomic decrement
                await product.reload({ transaction });
                const newStock = Number(product.stock);

                // 4. Record explicit reservation in the `stock_reservations` table
                const reservation = await StockReservation.create(
                    {
                        orderId: orderId ? Number(orderId) : null,
                        orderNumber: orderNumber ? String(orderNumber) : null,
                        productId: product.id,
                        quantity: requestedQty,
                        status: "reserved",
                        expiresAt
                    },
                    { transaction }
                );

                reservedItems.push({
                    reservationId: reservation.id,
                    productId: product.id,
                    vendorId: product.vendorId,
                    name: product.name,
                    quantityReserved: requestedQty,
                    remainingStock: newStock,
                    expiresAt
                });

                await outboxService.createOutboxEvent(
                    "ProductStockUpdated",
                    {
                        id: product.id,
                        vendorId: product.vendorId,
                        name: product.name,
                        stock: newStock,
                        quantitySold: requestedQty,
                        orderId: orderId || null
                    },
                    transaction
                );
            }

            await transaction.commit();
            return { success: true, reservedItems };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Releases / restores previously reserved stock back to inventory under row-level lock
     * and updates the corresponding record in `stock_reservations` to "released".
     */
    async releaseStock(params = {}) {
        const isArray = Array.isArray(params);
        const items = isArray ? params : (params.items || []);
        const orderId = isArray ? null : params.orderId;
        const orderNumber = isArray ? null : params.orderNumber;

        const transaction = await sequelize.transaction();

        try {
            const releasedItems = [];

            // Case A: Look up by orderId or orderNumber in stock_reservations
            if (orderId || orderNumber) {
                const whereClause = { status: "reserved" };
                if (orderId) whereClause.orderId = Number(orderId);
                else if (orderNumber) whereClause.orderNumber = String(orderNumber);

                const reservations = await StockReservation.findAll({
                    where: whereClause,
                    transaction
                });

                for (const res of reservations) {
                    const product = await Product.findByPk(res.productId, {
                        transaction,
                        lock: transaction.LOCK.UPDATE
                    });

                    if (product) {
                        await Product.update(
                            { stock: sequelize.literal(`stock + ${res.quantity}`) },
                            { where: { id: res.productId }, transaction }
                        );

                        await product.reload({ transaction });

                        releasedItems.push({
                            reservationId: res.id,
                            productId: product.id,
                            vendorId: product.vendorId,
                            name: product.name,
                            restoredQuantity: res.quantity,
                            newStock: Number(product.stock)
                        });

                        await outboxService.createOutboxEvent(
                            "ProductStockUpdated",
                            {
                                id: product.id,
                                vendorId: product.vendorId,
                                name: product.name,
                                stock: Number(product.stock),
                                quantityRestored: res.quantity,
                                orderId: orderId || null
                            },
                            transaction
                        );
                    }

                    res.status = "released";
                    await res.save({ transaction });
                }
            }

            // Case B: If no reservations were released by orderId, fall back to releasing provided items directly
            if (releasedItems.length === 0 && Array.isArray(items) && items.length > 0) {
                for (const item of items) {
                    if (!item.productId || !item.quantity) continue;

                    const product = await Product.findByPk(item.productId, {
                        transaction,
                        lock: transaction.LOCK.UPDATE
                    });

                    if (!product) continue;

                    const restoreQty = Number(item.quantity);

                    await Product.update(
                        { stock: sequelize.literal(`stock + ${restoreQty}`) },
                        { where: { id: item.productId }, transaction }
                    );

                    await product.reload({ transaction });
                    const newStock = Number(product.stock);

                    // Also mark matching reservation as released if exists
                    await StockReservation.update(
                        { status: "released" },
                        {
                            where: {
                                productId: item.productId,
                                status: "reserved",
                                ...(orderId ? { orderId } : {})
                            },
                            limit: 1,
                            transaction
                        }
                    );

                    releasedItems.push({
                        productId: product.id,
                        vendorId: product.vendorId,
                        name: product.name,
                        restoredQuantity: restoreQty,
                        newStock
                    });

                    await outboxService.createOutboxEvent(
                        "ProductStockUpdated",
                        {
                            id: product.id,
                            vendorId: product.vendorId,
                            name: product.name,
                            stock: newStock,
                            quantityRestored: restoreQty,
                            orderId: orderId || null
                        },
                        transaction
                    );
                }
            }

            await transaction.commit();
            return { success: true, releasedItems };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Confirms reservations for a given orderId/orderNumber upon successful payment.
     * Transitions status from "reserved" to "confirmed".
     */
    async confirmReservation(orderIdOrNumber) {
        if (!orderIdOrNumber) return;

        const isNumeric = !isNaN(Number(orderIdOrNumber));
        const whereClause = isNumeric
            ? { [Op.or]: [{ orderId: Number(orderIdOrNumber) }, { orderNumber: String(orderIdOrNumber) }], status: "reserved" }
            : { orderNumber: String(orderIdOrNumber), status: "reserved" };

        const [affectedCount] = await StockReservation.update(
            { status: "confirmed" },
            { where: whereClause }
        );

        console.log(`[Product Service] Confirmed ${affectedCount} reservation(s) for order ${orderIdOrNumber}`);
        return { confirmedCount: affectedCount };
    }

    /**
     * Background worker task: cleans up any abandoned reservations where expiresAt < now.
     * Restores the held stock back to the shelf and updates status to "expired".
     */
    async releaseExpiredReservations() {
        const expiredReservations = await StockReservation.findAll({
            where: {
                status: "reserved",
                expiresAt: {
                    [Op.lt]: new Date()
                }
            }
        });

        if (expiredReservations.length === 0) return 0;

        console.log(`[Product Service] Found ${expiredReservations.length} expired reservation(s) to release...`);
        let releasedCount = 0;

        for (const res of expiredReservations) {
            const transaction = await sequelize.transaction();
            try {
                const product = await Product.findByPk(res.productId, {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                if (product) {
                    await Product.update(
                        { stock: sequelize.literal(`stock + ${res.quantity}`) },
                        { where: { id: res.productId }, transaction }
                    );

                    await product.reload({ transaction });

                    await outboxService.createOutboxEvent(
                        "ProductStockUpdated",
                        {
                            id: product.id,
                            vendorId: product.vendorId,
                            name: product.name,
                            stock: Number(product.stock),
                            quantityRestored: res.quantity,
                            orderId: res.orderId
                        },
                        transaction
                    );
                }

                res.status = "expired";
                await res.save({ transaction });
                await transaction.commit();
                releasedCount++;
            } catch (err) {
                await transaction.rollback();
                console.error(`[Product Service] Failed to release expired reservation #${res.id}:`, err.message);
            }
        }

        return releasedCount;
    }
}

export default new ProductService();