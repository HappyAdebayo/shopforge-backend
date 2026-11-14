import Joi from "joi";

const CategoryValidation = {

    create: (data) => {

        const schema = Joi.object({
            name: Joi.string().trim().min(2).max(100).required(),

            description: Joi.string().trim().max(500).allow("", null).optional()
        });

        return schema.validate(data);
    },

    categoryId: (id) => {

        const schema = Joi.number().integer().positive().required();

        return schema.validate(id);
    }
};

export default CategoryValidation;