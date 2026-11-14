import ReviewService from "./review.service.js";
import ReviewValidation from "./review.validation.js";

class ReviewController {
    async create(req, res) {
        try {
            const { productId } = req.params;
            const { error } = ReviewValidation.create(req.body);

            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const userId = req.user.id;
            const userInfo = {
                name: req.user.name || "Customer",
                email: req.user.email || null
            };

            const review = await ReviewService.createReview(
                productId,
                userId,
                userInfo,
                req.body
            );

            return res.status(201).json({
                message: "Review submitted successfully",
                data: review
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }
    }

    async index(req, res) {
        try {
            const { productId } = req.params;
            const result = await ReviewService.getProductReviews(productId, req.query);

            return res.status(200).json({
                message: "Reviews retrieved successfully",
                data: result
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }
    }

    async delete(req, res) {
        try {
            const { reviewId } = req.params;
            const userId = req.user.id;
            const userRole = req.user.role;

            const result = await ReviewService.deleteReview(reviewId, userId, userRole);

            return res.status(200).json({
                message: "Review deleted successfully",
                data: result
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }
    }
}

export default new ReviewController();
