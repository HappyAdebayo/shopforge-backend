import ProductService from "./product.service.js";
import ProductValidation from "./product.validation.js";

class ProductController {

    async create(req, res) {

        try {

            const { error } = ProductValidation.create(
                req.body
            );

            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const product = await ProductService.create(
                req.body
            );

            return res.status(201).json({
                message: "Product created successfully",
                data: product
            });

        } catch (error) {

            return res.status(400).json({
                message: error.message
            });

        }
    }

    async index(req, res) {

        try {

            const { categoryId, search, page, limit } = req.query;

            const result = await ProductService.getAll({
                categoryId,
                search,
                page: Number(page) || 1,
                limit: Number(limit) || 20
            });

            return res.status(200).json({
                message: "Products retrieved successfully",
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

            const { error } = ProductValidation.productId(
                req.params.id
            );

            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const product = await ProductService.getById(
                req.params.id
            );

            return res.status(200).json({
                message: "Product retrieved successfully",
                data: product
            });

        } catch (error) {

            return res.status(404).json({
                message: error.message
            });

        }
    }

    async update(req, res) {

        try {

            const { error } = ProductValidation.productId(
                req.params.id
            );

            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const { error: validationError } =
                ProductValidation.update(req.body);

            if (validationError) {
                return res.status(400).json({
                    message: validationError.details[0].message
                });
            }

            const product = await ProductService.update(
                req.params.id,
                req.body
            );

            return res.status(200).json({
                message: "Product updated successfully",
                data: product
            });

        } catch (error) {

            return res.status(400).json({
                message: error.message
            });

        }
    }

    async delete(req, res) {

        try {

            const { error } = ProductValidation.productId(
                req.params.id
            );

            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const product = await ProductService.delete(
                req.params.id
            );

            return res.status(200).json({
                message: "Product deleted successfully",
                data: product
            });

        } catch (error) {

            return res.status(400).json({
                message: error.message
            });

        }
    }

    async myProducts(req, res) {

        try {

            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;

            const vendorId = req.user.vendorId || req.user.id;

            const result = await ProductService.getVendorProducts(
                vendorId,
                {
                    page,
                    limit
                }
            );

            return res.status(200).json({
                message: "Vendor products retrieved successfully",
                data: result
            });

        } catch (error) {

            return res.status(400).json({
                message: error.message
            });

        }
    }

    async count(req, res) {

        try {

            const count = await ProductService.getProductCount();

            return res.status(200).json({
                message: "Product count retrieved successfully",
                data: {
                    count
                }
            });

        } catch (error) {

            return res.status(400).json({
                message: error.message
            });

        }
    }

    async reserveStock(req, res) {
        try {
            const result = await ProductService.reserveStock(req.body);

            return res.status(200).json({
                message: "Stock reserved successfully",
                data: result
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }
    }

    async releaseStock(req, res) {
        try {
            const result = await ProductService.releaseStock(req.body);

            return res.status(200).json({
                message: "Stock released successfully",
                data: result
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }
    }

    async confirmReservation(req, res) {
        try {
            const { orderId, orderNumber } = req.body;
            const result = await ProductService.confirmReservation(orderId || orderNumber);

            return res.status(200).json({
                message: "Stock reservation confirmed",
                data: result
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }
    }
}

export default new ProductController();