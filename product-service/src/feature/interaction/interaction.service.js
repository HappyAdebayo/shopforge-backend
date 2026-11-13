import Interaction, { VALID_EVENTS } from "./interaction.model.js";
import Product from "../product/product.model.js";

class InteractionService {
    /**
     * Record a single interaction event
     * @param {Object} param0
     * @param {number} param0.userId
     * @param {number} param0.productId
     * @param {'view'|'addtocart'|'transaction'} param0.event
     * @param {Date} [param0.timestamp]
     */
    async recordInteraction({ userId, productId, event, timestamp = new Date() }) {
        if (!userId) {
            throw new Error("userId is required to record an interaction");
        }
        if (!productId) {
            throw new Error("productId is required to record an interaction");
        }
        if (!VALID_EVENTS.includes(event)) {
            throw new Error(`Invalid event: "${event}". Must be one of: ${VALID_EVENTS.join(", ")}`);
        }

        return await Interaction.create({
            userId: parseInt(userId, 10),
            productId: parseInt(productId, 10),
            event,
            timestamp
        });
    }

    /**
     * Record multiple interactions in bulk (e.g. multi-item order purchase)
     * @param {Array<{userId: number, productId: number, event: string, timestamp?: Date}>} interactions
     */
    async recordBatchInteractions(interactions) {
        if (!Array.isArray(interactions) || interactions.length === 0) {
            return [];
        }

        const validRecords = [];
        for (const item of interactions) {
            if (item.userId && item.productId && VALID_EVENTS.includes(item.event)) {
                validRecords.push({
                    userId: parseInt(item.userId, 10),
                    productId: parseInt(item.productId, 10),
                    event: item.event,
                    timestamp: item.timestamp || new Date()
                });
            }
        }

        if (validRecords.length === 0) {
            return [];
        }

        return await Interaction.bulkCreate(validRecords);
    }

    /**
     * Get interactions for a specific user
     */
    async getUserInteractions(userId, { limit = 50, offset = 0, event } = {}) {
        const where = { userId: parseInt(userId, 10) };
        if (event && VALID_EVENTS.includes(event)) {
            where.event = event;
        }

        return await Interaction.findAndCountAll({
            where,
            include: [
                {
                    model: Product,
                    as: "product",
                    attributes: ["id", "name", "price", "status"]
                }
            ],
            order: [["timestamp", "DESC"]],
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10)
        });
    }

    /**
     * Get interactions for a specific product
     */
    async getProductInteractions(productId, { limit = 50, offset = 0, event } = {}) {
        const where = { productId: parseInt(productId, 10) };
        if (event && VALID_EVENTS.includes(event)) {
            where.event = event;
        }

        return await Interaction.findAndCountAll({
            where,
            order: [["timestamp", "DESC"]],
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10)
        });
    }

    /**
     * Get aggregate statistics for a product (counts of view, addtocart, transaction)
     */
    async getProductStats(productId) {
        const counts = await Interaction.findAll({
            attributes: [
                "event",
                [Interaction.sequelize.fn("COUNT", Interaction.sequelize.col("id")), "count"]
            ],
            where: { productId: parseInt(productId, 10) },
            group: ["event"],
            raw: true
        });

        const stats = {
            productId: parseInt(productId, 10),
            view: 0,
            addtocart: 0,
            transaction: 0
        };

        for (const row of counts) {
            if (stats[row.event] !== undefined) {
                stats[row.event] = parseInt(row.count, 10);
            }
        }

        return stats;
    }
}

export default new InteractionService();
