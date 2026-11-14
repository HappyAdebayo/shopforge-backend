import Joi from "joi";

const ReviewValidation = {
    create: (data) => {
        const schema = Joi.object({
            rating: Joi.number().integer().min(1).max(5).required().messages({
                "number.base": "Rating must be a number",
                "number.min": "Rating must be between 1 and 5",
                "number.max": "Rating must be between 1 and 5",
                "any.required": "Rating is required"
            }),
            title: Joi.string().trim().max(150).allow("", null).optional(),
            comment: Joi.string().trim().min(3).max(2000).required().messages({
                "string.empty": "Comment cannot be empty",
                "string.min": "Comment must be at least 3 characters",
                "string.max": "Comment cannot exceed 2000 characters",
                "any.required": "Comment is required"
            })
        });

        return schema.validate(data, { abortEarly: false, allowUnknown: true });
    }
};

export default ReviewValidation;
