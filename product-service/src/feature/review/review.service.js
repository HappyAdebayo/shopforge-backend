import Review from "./review.model.js";
import Product from "../product/product.model.js";

class ReviewService {
    async createReview(productId, userId, userInfo, data) {
        const product = await Product.findByPk(productId);
        if (!product) {
            throw new Error("Product not found");
        }

        const existingReview = await Review.findOne({
            where: {
                productId,
                userId
            }
        });

        if (existingReview) {
            // Update existing review
            existingReview.rating = Number(data.rating);
            existingReview.title = data.title || existingReview.title;
            existingReview.comment = data.comment;
            existingReview.userName = userInfo.name || existingReview.userName;
            existingReview.userEmail = userInfo.email || existingReview.userEmail;
            await existingReview.save();
            return existingReview;
        }

        const review = await Review.create({
            productId: Number(productId),
            userId: Number(userId),
            userName: userInfo.name || "Customer",
            userEmail: userInfo.email || null,
            rating: Number(data.rating),
            title: data.title || null,
            comment: data.comment,
            status: "approved"
        });

        return review;
    }

    async getProductReviews(productId, query = {}) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
        const offset = (page - 1) * limit;

        const { count, rows } = await Review.findAndCountAll({
            where: {
                productId: Number(productId),
                status: "approved"
            },
            order: [["createdAt", "DESC"]],
            limit,
            offset
        });

        // Compute rating distribution and average
        const allApproved = await Review.findAll({
            where: {
                productId: Number(productId),
                status: "approved"
            },
            attributes: ["rating"]
        });

        const totalReviews = allApproved.length;
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let sum = 0;

        for (const r of allApproved) {
            const val = r.rating;
            if (distribution[val] !== undefined) {
                distribution[val]++;
            }
            sum += val;
        }

        const averageRating = totalReviews > 0 ? Number((sum / totalReviews).toFixed(1)) : 0;

        return {
            reviews: rows,
            stats: {
                totalReviews,
                averageRating,
                distribution
            },
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: limit
            }
        };
    }

    async deleteReview(reviewId, userId, userRole = "user") {
        const review = await Review.findByPk(reviewId);
        if (!review) {
            throw new Error("Review not found");
        }

        if (userRole !== "admin" && review.userId !== Number(userId)) {
            throw new Error("You are not authorized to delete this review");
        }

        await review.destroy();
        return { success: true };
    }
}

export default new ReviewService();
