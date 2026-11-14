import AuthService from "./auth.service.js";
import AuthValidation from "./auth.validation.js";

class AuthController {

    async signup(req, res) {

        try {

            const { error } = AuthValidation.signup(req.body);

            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const result = await AuthService.signup(req.body);

            return res.status(201).json({
                message: "Account created successfully",
                data: result
            });

        } catch (error) {

            return res.status(400).json({
                message: error.message
            });

        }
    }

    async login(req, res) {

        try {

            const { error } = AuthValidation.login(req.body);

            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const result = await AuthService.login(req.body);

            return res.status(200).json(result);

        } catch (error) {

            return res.status(401).json({
                message: error.message
            });

        }
    }

    async refresh(req, res) {

        try {

            const { refreshToken } = req.body;

            const result = await AuthService.refresh(refreshToken);

            return res.status(200).json({
                message: "Token refreshed successfully",
                data: result
            });

        } catch (error) {

            return res.status(401).json({
                message: error.message
            });

        }
    }

    async getUserById(req, res) {
        try {
            const user = await AuthService.getUserById(req.params.id);
            return res.status(200).json({
                message: "User retrieved successfully",
                data: user
            });
        } catch (error) {
            return res.status(404).json({
                message: error.message
            });
        }
    }

    async getAdminUsers(req, res) {
        try {
            const admins = await AuthService.getAdminUsers();
            return res.status(200).json({
                message: "Admin users retrieved successfully",
                data: admins
            });
        } catch (error) {
            return res.status(500).json({
                message: error.message
            });
        }
    }
}

export default new AuthController();