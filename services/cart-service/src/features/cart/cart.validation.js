import Joi from "joi";

class CartValidation {
    addItem(data) {
        const schema = Joi.object({
            productId: Joi.number().integer().positive().required().messages({
                "number.base": "Product ID must be a number",
                "number.positive": "Product ID must be a positive integer",
                "any.required": "Product ID is required"
            }),
            quantity: Joi.number().integer().min(1).default(1).messages({
                "number.base": "Quantity must be a number",
                "number.min": "Quantity must be at least 1"
            })
        });

        return schema.validate(data, { abortEarly: false, allowUnknown: false });
    }

    updateQuantity(data) {
        const schema = Joi.object({
            quantity: Joi.number().integer().min(0).required().messages({
                "number.base": "Quantity must be a number",
                "number.min": "Quantity must be 0 or greater",
                "any.required": "Quantity is required"
            })
        });

        return schema.validate(data, { abortEarly: false, allowUnknown: false });
    }

    itemId(id) {
        const schema = Joi.number().integer().positive().required().messages({
            "number.base": "Item ID must be a number",
            "number.positive": "Item ID must be a positive integer",
            "any.required": "Item ID is required"
        });

        return schema.validate(id);
    }
}

export default new CartValidation();
