import Joi from "joi";

class AuthValidation {
    signup(data) {
       const schema = Joi.object({
        name: Joi.string().trim().min(2).required(),
        email: Joi.string().email().trim().required(),
        password: Joi.string().min(6).required()
       }).required()
       return schema.validate(data)
      }

    login(data){
        const schema = Joi.object({
            email: Joi.string().email().trim().required(),
            password: Joi.string().required()
        }).required()

        return schema.validate(data)
    }
}

export default new AuthValidation()
   