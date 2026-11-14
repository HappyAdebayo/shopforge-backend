import Joi from "joi";
import { VALID_EVENTS } from "./interaction.model.js";

const InteractionValidation = {
    record: (data) => {
        const schema = Joi.object({
            productId: Joi.number().integer().positive().required(),
            event: Joi.string()
                .valid(...VALID_EVENTS)
                .required()
                .messages({
                    "any.only": `Event must be one of: ${VALID_EVENTS.join(", ")}`
                }),
            userId: Joi.number().integer().positive().optional(),
            timestamp: Joi.date().iso().optional()
        });

        return schema.validate(data);
    },

    query: (query) => {
        const schema = Joi.object({
            limit: Joi.number().integer().min(1).max(100).default(50),
            offset: Joi.number().integer().min(0).default(0),
            event: Joi.string().valid(...VALID_EVENTS).optional()
        });

        return schema.validate(query);
    }
};

export default InteractionValidation;
