import CategoryService from "./category.service.js";
import CategoryValidation from "./category.validation.js";

class CategoryController {

    async create(req, res) {

        try {

            const { error } = CategoryValidation.create(
                req.body
            );

            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const category = await CategoryService.create(
                req.body
            );

            return res.status(201).json({
                message: "Category created successfully",
                data: category
            });

        } catch (error) {

            return res.status(400).json({
                message: error.message
            });

        }
    }

    async index(req, res) {

        try {

            const categories = await CategoryService.getAll();

            return res.status(200).json({
                message: "Categories retrieved successfully",
                data: categories
            });

        } catch (error) {

            return res.status(400).json({
                message: error.message
            });

        }
    }

    async show(req, res) {

        try {

            const { error } = CategoryValidation.categoryId(
                req.params.id
            );

            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const category = await CategoryService.getById(
                req.params.id
            );

            return res.status(200).json({
                message: "Category retrieved successfully",
                data: category
            });

        } catch (error) {

            return res.status(404).json({
                message: error.message
            });

        }
    }

    async delete(req, res) {

        try {

            const { error } = CategoryValidation.categoryId(
                req.params.id
            );

            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const category = await CategoryService.delete(
                req.params.id
            );

            return res.status(200).json({
                message: "Category deleted successfully",
                data: category
            });

        } catch (error) {

            return res.status(400).json({
                message: error.message
            });

        }
    }
}

export default new CategoryController();