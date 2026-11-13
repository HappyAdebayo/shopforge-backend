import Joi from "joi";

class PaymentValidation {
    initialize(data) {
        const schema = Joi.object({
            orderId: Joi.number().integer().positive().required().messages({
                "any.required": "Order ID is required"
            }),
            amount: Joi.number().positive().required().messages({
                "number.positive": "Amount must be greater than zero",
                "any.required": "Amount is required"
            }),
            currency: Joi.string().uppercase().default("NGN").optional(),
            customerEmail: Joi.string().email().optional(),
            provider: Joi.string().valid("mock", "stripe", "paystack", "flutterwave").default("mock").optional(),
            callbackUrl: Joi.string().uri().allow("", null).optional(),
            metadata: Joi.object().optional()
        });

        return schema.validate(data, { abortEarly: false, allowUnknown: false });
    }

    verify(data) {
        const schema = Joi.object({
            reference: Joi.string().required().messages({
                "any.required": "Payment reference is required"
            }),
            provider: Joi.string().valid("mock", "stripe", "paystack", "flutterwave").optional(),
            sessionId: Joi.string().allow("", null).optional(),
            accessCode: Joi.string().allow("", null).optional(),
            simulateFailure: Joi.boolean().optional()
        });

        return schema.validate(data, { abortEarly: false, allowUnknown: false });
    }

    refund(data) {
        const schema = Joi.object({
            amount: Joi.number().positive().required().messages({
                "any.required": "Refund amount is required"
            }),
            reason: Joi.string().allow("", null).optional()
        });

        return schema.validate(data, { abortEarly: false, allowUnknown: false });
    }
}

export default new PaymentValidation();
