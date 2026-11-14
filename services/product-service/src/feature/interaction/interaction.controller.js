import interactionService from "./interaction.service.js";
import InteractionValidation from "./interaction.validation.js";

class InteractionController {
    async record(req, res) {
        try {
            const { error, value } = InteractionValidation.record(req.body);
            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const userId = req.user?.id || value.userId;
            if (!userId) {
                return res.status(401).json({
                    message: "User ID is required (must authenticate or provide userId)"
                });
            }

            const interaction = await interactionService.recordInteraction({
                userId,
                productId: value.productId,
                event: value.event,
                timestamp: value.timestamp
            });

            return res.status(201).json({
                message: "Interaction recorded successfully",
                data: interaction
            });
        } catch (error) {
            return res.status(500).json({
                message: error.message
            });
        }
    }

    async myInteractions(req, res) {
        try {
            const { error, value } = InteractionValidation.query(req.query);
            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const userId = req.user.id;
            const result = await interactionService.getUserInteractions(userId, value);

            return res.status(200).json({
                message: "Interactions retrieved successfully",
                data: result.rows,
                total: result.count,
                limit: value.limit,
                offset: value.offset
            });
        } catch (error) {
            return res.status(500).json({
                message: error.message
            });
        }
    }

    async productInteractions(req, res) {
        try {
            const { error, value } = InteractionValidation.query(req.query);
            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const productId = req.params.productId;
            const result = await interactionService.getProductInteractions(productId, value);

            return res.status(200).json({
                message: "Product interactions retrieved successfully",
                data: result.rows,
                total: result.count,
                limit: value.limit,
                offset: value.offset
            });
        } catch (error) {
            return res.status(500).json({
                message: error.message
            });
        }
    }

    async productStats(req, res) {
        try {
            const productId = req.params.productId;
            const stats = await interactionService.getProductStats(productId);

            return res.status(200).json({
                message: "Product interaction stats retrieved successfully",
                data: stats
            });
        } catch (error) {
            return res.status(500).json({
                message: error.message
            });
        }
    }
}

export default new InteractionController();
