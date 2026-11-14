import Joi from "joi";

class OrderValidation {
    create(data) {
        const itemSchema = Joi.object({
            productId: Joi.number().integer().positive().required(),
            quantity: Joi.number().integer().positive().required(),
            price: Joi.number().min(0).optional(),
            name: Joi.string().optional(),
            imageUrl: Joi.string().allow(null, "").optional()
        });

        const schema = Joi.object({
            items: Joi.array().items(itemSchema).min(1).required().messages({
                "array.min": "At least one order item is required"
            }),
            customerEmail: Joi.string().email().optional(),
            customerName: Joi.string().allow("", null).optional(),
            currency: Joi.string().default("NGN").optional(),
            tax: Joi.number().min(0).default(0.00).optional(),
            shippingFee: Joi.number().min(0).default(0.00).optional(),
            shippingAddress: Joi.alternatives().try(
                Joi.object(),
                Joi.string()
            ).optional(),
            paymentProvider: Joi.string().valid("mock", "stripe", "paystack", "flutterwave").default("mock").optional(),
            notes: Joi.string().allow("", null).optional()
        });

        return schema.validate(data, { abortEarly: false, allowUnknown: false });
    }

    updateStatus(data) {
        const schema = Joi.object({
            status: Joi.string().valid(
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
                "payment_failed"
            ).required().messages({
                "any.only": "Invalid status value"
            }),
            notes: Joi.string().allow("", null).optional()
        });

        return schema.validate(data, { abortEarly: false, allowUnknown: false });
    }

    orderId(id) {
        const schema = Joi.alternatives().try(
            Joi.number().integer().positive(),
            Joi.string().min(1)
        ).required();

        return schema.validate(id);
    }
}

export default new OrderValidation();
