
import AuthService from "./auth.service.js";
import AuthValidation from "./auth.validation.js";
import { HttpError } from "../../../../../packages/common/src/index.js";

class AuthController {

    async signup(req, res, next) {
        try {
            const { error } = AuthValidation.signup(req.body);

            if (error) {
                throw new HttpError(400, error.details[0].message);
            }

            const result = await AuthService.signup(req.body);

            return res.status(201).json({
                message: "Account created successfully",
                data: result
            });

        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { error } = AuthValidation.login(req.body);

            if (error) {
                throw new HttpError(400, error.details[0].message);
            }

            const result = await AuthService.login(req.body);

            return res.status(200).json(result);

        } catch (error) {
            next(error);
        }
    }

    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;

            const result = await AuthService.refresh(refreshToken);

            return res.status(200).json({
                message: "Token refreshed successfully",
                data: result
            });

        } catch (error) {
            next(error);
        }
    }

    async getUserById(req, res, next) {
        try {
            const user = await AuthService.getUserById(req.params.id);

            return res.status(200).json({
                message: "User retrieved successfully",
                data: user
            });

        } catch (error) {
            next(error);
        }
    }

    async getAdminUsers(req, res, next) {
        try {
            const admins = await AuthService.getAdminUsers();

            return res.status(200).json({
                message: "Admin users retrieved successfully",
                data: admins
            });

        } catch (error) {
            next(error);
        }
    }
}

export default new AuthController();
