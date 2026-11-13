import Joi from "joi";

class VendorValidation {

    apply(data) {

        const schema = Joi.object({
            businessName: Joi.string().trim().min(2).required(),
            description: Joi.string().trim().min(10).required(),

            logoUrl: Joi.string().uri().allow(null, "").optional()
        }).required();

        return schema.validate(data);
    }

    applicationId(id) {

        const schema = Joi.number().integer().positive().required();

        return schema.validate(id);
    }
}

export default new VendorValidation();