import Category from "./category.model.js";

class CategoryService {

    async create(data) {

        const existingCategory = await Category.findOne({
            where: {
                name: data.name
            }
        });

        if (existingCategory) {
            throw new Error("Category already exists");
        }

        const category = await Category.create({
            name: data.name,
            description: data.description
        });

        return category;
    }

    async getAll() {

        const categories = await Category.findAll({
            where: {
                status: "active"
            },
            order: [
                ["name", "ASC"]
            ]
        });

        return categories;
    }

    async getById(id) {

        const category = await Category.findByPk(id);

        if (!category) {
            throw new Error("Category not found");
        }

        return category;
    }

    async delete(id) {

        const category = await Category.findByPk(id);

        if (!category) {
            throw new Error("Category not found");
        }

        if (category.status === "inactive") {
            throw new Error("Category is already inactive");
        }

        category.status = "inactive";

        await category.save();

        return category;
    }
}

export default new CategoryService();