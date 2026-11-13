import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "./auth.model.js";
import sequelize from "../../config/db.js";
import outboxService from "../../outbox-service/outbox.service.js";

class AuthService {
    async signup(data) {
        const { name, email, password } = data;
        const existingUser = await User.findOne({
            where: { email }
        });

        if (existingUser) {
            throw new Error("Email already in use");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const transaction = await sequelize.transaction();

        try {
            const user = await User.create(
                {
                    name,
                    email,
                    password: hashedPassword,
                    role: "user",
                    vendorStatus: "none"
                },
                { transaction }
            );

            // Record outbox event for async queue processing (email worker, etc.)
            await outboxService.createOutboxEvent(
                "UserSignedUp",
                {
                    userId: user.id,
                    name: user.name,
                    email: user.email
                },
                transaction
            );

            await transaction.commit();

            return {
                user
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async login(data) {
        const { email, password } = data;

        const user = await User.findOne({
            where: { email }
        });

        if (!user) {
            throw new Error("Invalid email or password");
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            throw new Error("Invalid email or password");
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                vendorStatus: user.vendorStatus
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "15m"
            }
        );
        const refreshToken = jwt.sign(
            {
                id: user.id,
                role: user.role,
                vendorStatus: user.vendorStatus
            },
            process.env.REFRESH_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return {
            message: "Login successful",
            token,
            refreshToken,
            user
        };
    }

    async refresh(refreshToken) {
        if (!refreshToken) {
            throw new Error("Refresh token is required");
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_SECRET
        );

        const user = await User.findByPk(decoded.id);
        if (!user) {
            throw new Error("User not found");
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                vendorStatus: user.vendorStatus
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "15m"
            }
        );

        const newRefreshToken = jwt.sign(
            {
                id: user.id,
                role: user.role,
                vendorStatus: user.vendorStatus
            },
            process.env.REFRESH_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return {
            token,
            refreshToken: newRefreshToken,
            user
        };
    }

    async getUserById(id) {
        const user = await User.findByPk(id, {
            attributes: ["id", "name", "email", "role", "vendorStatus"]
        });
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }

    async getAdminUsers() {
        const admins = await User.findAll({
            where: { role: "admin" },
            attributes: ["id", "name", "email"]
        });
        return admins;
    }
}

export default new AuthService();