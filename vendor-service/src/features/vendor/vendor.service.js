import { Op } from "sequelize";
import VendorApplication from "./vendorApplication.model.js";
import Vendor from "./vendor.model.js";
import outboxService from "../../outbox-service/outbox.service.js";
import sequelize from "../../config/db.js";


class VendorService {

    async apply(data, userId) {

        const { businessName, description, logoUrl } = data;

        // Check if user is already an approved vendor
        const existingVendor = await Vendor.findOne({ where: { userId } });
        if (existingVendor) {
            throw new Error("You are already an approved vendor");
        }

        // Check if user already has an active pending or approved application
        const activeApplication = await VendorApplication.findOne({
            where: {
                userId,
                status: {
                    [Op.in]: ["pending", "approved"]
                }
            },
            order: [["createdAt", "DESC"]]
        });

        if (activeApplication) {
            if (activeApplication.status === "approved") {
                throw new Error("You are already an approved vendor");
            }
            throw new Error("You already have a vendor application under review");
        }

        const application = await VendorApplication.create({
            userId,
            businessName,
            description,
            logoUrl,
            status: "pending"
        });

        // Write to outbox — outbox worker publishes to RabbitMQ
        await outboxService.createOutboxEvent(
            "VendorApplicationSubmitted",
            { userId, applicationId: application.id, businessName }
        );

        return { application };
    }


    async approveApplication(applicationId) {

        const transaction = await sequelize.transaction();

        try {

            const application = await VendorApplication.findByPk(
                applicationId,
                { transaction }
            );

            if (!application) {
                throw new Error("Vendor application not found");
            }

            if (application.status !== "pending") {
                throw new Error(
                    "Vendor application has already been processed"
                );
            }

            const vendor = await Vendor.create(
                {
                    userId: application.userId,
                    businessName: application.businessName,
                    description: application.description,
                    logoUrl: application.logoUrl
                },
                { transaction }
            );

            application.status = "approved";

            await application.save({ transaction });

            await outboxService.createOutboxEvent(
                "VendorApplicationApproved",
                {
                    userId: application.userId,
                    vendorId: vendor.id,
                    applicationId: application.id,
                    businessName: application.businessName
                },
                transaction
            );

            await transaction.commit();

            return { application, vendor };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async rejectApplication(applicationId) {

        const transaction = await sequelize.transaction();

        try {

            const application = await VendorApplication.findByPk(
                applicationId,
                { transaction }
            );

            if (!application) {
                throw new Error("Vendor application not found");
            }

            if (application.status !== "pending") {
                throw new Error(
                    "Vendor application has already been processed"
                );
            }

            application.status = "rejected";

            await application.save({ transaction });

            await outboxService.createOutboxEvent(
                "VendorApplicationRejected",
                {
                    userId: application.userId,
                    applicationId: application.id,
                    businessName: application.businessName
                },
                transaction
            );

            await transaction.commit();

            return { application };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async getById(id) {
        let vendor = await Vendor.findByPk(id);
        if (!vendor) {
            vendor = await Vendor.findOne({ where: { userId: id } });
        }
        if (!vendor) {
            const app = await VendorApplication.findOne({ where: { userId: id, status: "approved" } });
            if (app) {
                return { id: app.userId, userId: app.userId, businessName: app.businessName, description: app.description };
            }
        }
        return vendor;
    }

    async getByUserId(userId) {
        let vendor = await Vendor.findOne({ where: { userId } });
        if (!vendor) {
            const app = await VendorApplication.findOne({ where: { userId, status: "approved" } });
            if (app) {
                return { id: app.userId, userId: app.userId, businessName: app.businessName, description: app.description };
            }
        }
        return vendor;
    }

    async getApplicationByUserId(userId) {
        const application = await VendorApplication.findOne({
            where: { userId },
            order: [["createdAt", "DESC"]]
        });
        return application;
    }

    async getApplications(page = 1, limit = 10) {

        const offset = (page - 1) * limit;

        const result = await VendorApplication.findAndCountAll({
            limit,
            offset,
            order: [
                [
                    sequelize.literal(`
                        CASE
                            WHEN status = 'pending' THEN 1
                            WHEN status = 'approved' THEN 2
                            WHEN status = 'rejected' THEN 3
                            ELSE 4
                        END
                    `),
                    "ASC"
                ],
                ["createdAt", "DESC"]
            ]
        });

        return {
            applications: result.rows,
            pagination: {
                total: result.count,
                page,
                limit,
                totalPages: Math.ceil(result.count / limit)
            }
        };
    }
}

export default new VendorService();