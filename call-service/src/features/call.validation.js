import Joi from "joi";

const CallValidation = {

    create: (data) => {

        const schema = Joi.object({

            vendorId: Joi.number()
                .integer()
                .positive()
                .required(),
            callerName: Joi.string().allow("", null).optional(),
            vendorName: Joi.string().allow("", null).optional()
        });

        return schema.validate(data);
    },

    callId: (id) => {

        const schema = Joi.number()
            .integer()
            .positive()
            .required();

        return schema.validate(id);
    }

};

export default CallValidation;