import Joi from "joi";

const ProductValidation = {

    create: (data) => {

        const schema = Joi.object({

            vendorId: Joi.number()
                .integer()
                .positive()
                .required(),

            categoryId: Joi.number()
                .integer()
                .positive()
                .required(),

            name: Joi.string()
                .trim()
                .min(2)
                .max(150)
                .required(),

            description: Joi.string()
                .trim()
                .min(5)
                .max(2000)
                .required(),

            price: Joi.number()
                .positive()
                .required(),

            stock: Joi.number()
                .integer()
                .min(0)
                .required(),

            images: Joi.array()
                .items(
                    Joi.object({
                        imageUrl: Joi.string()
                            .uri()
                            .required(),

                        isPrimary: Joi.boolean()
                            .default(false)
                    })
                )
                .min(1)
                .max(10)
                .required()
                .custom((images, helpers) => {

                    const primaryImages = images.filter(
                        image => image.isPrimary === true
                    );

                    if (primaryImages.length !== 1) {
                        return helpers.error(
                            "any.custom",
                            {
                                message: "Product must have exactly one primary image"
                            }
                        );
                    }

                    return images;
                })

        });

        return schema.validate(data);
    },

    update: (data) => {

        const schema = Joi.object({

            categoryId: Joi.number()
                .integer()
                .positive()
                .optional(),

            name: Joi.string()
                .trim()
                .min(2)
                .max(150)
                .optional(),

            description: Joi.string()
                .trim()
                .min(5)
                .max(2000)
                .optional(),

            price: Joi.number()
                .positive()
                .optional(),

            stock: Joi.number()
                .integer()
                .min(0)
                .optional(),

            images: Joi.array()
                .items(
                    Joi.object({
                        imageUrl: Joi.string()
                            .uri()
                            .required(),

                        isPrimary: Joi.boolean()
                            .optional()
                            .default(false)
                    })
                )
                .min(1)
                .optional()

        });

        return schema.validate(data);
    },

    productId: (id) => {

        const schema = Joi.number()
            .integer()
            .positive()
            .required();

        return schema.validate(id);
    }

};

export default ProductValidation;