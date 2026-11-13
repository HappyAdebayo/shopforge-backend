import VendorService from "./vendor.service.js";
import VendorValidation from "./vendor.validation.js";

class VendorController {

    async apply(req, res) {
        try {

            const { error } = VendorValidation.apply(req.body);

            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const userId = req.user.id;

            const result = await VendorService.apply(
                req.body,
                userId
            );

            return res.status(201).json({
                message: "Vendor application submitted successfully",
                data: result
            });

        } catch (error) {

            return res.status(400).json({
                message: error.message
            });

        }
    }

    async approve(req, res) {
        try {

            const { error } = VendorValidation.applicationId(
                req.params.id
            );

            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const result = await VendorService.approveApplication(
                req.params.id
            );

            return res.status(200).json({
                message: "Vendor application approved successfully",
                data: result
            });

        } catch (error) {

            return res.status(400).json({
                message: error.message
            });

        }
    }

    async reject(req, res) {

        try {

            const { error } = VendorValidation.applicationId(
                req.params.id
            );

            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const result = await VendorService.rejectApplication(
                req.params.id
            );

            return res.status(200).json({
                message: "Vendor application rejected successfully",
                data: result
            });

        } catch (error) {

            return res.status(400).json({
                message: error.message
            });

        }
    }

    async index(req, res) {

        try {

            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;

            if (page < 1 || limit < 1) {
                return res.status(400).json({
                    message: "Page and limit must be greater than 0"
                });
            }

            const result = await VendorService.getApplications(
                page,
                limit
            );

            return res.status(200).json({
                message: "Vendor applications retrieved successfully",
                data: result
            });

        } catch (error) {

            return res.status(400).json({
                message: error.message
            });

        }
    }

    async show(req, res) {
        try {
            const vendor = await VendorService.getById(req.params.id);
            if (!vendor) {
                return res.status(404).json({ message: "Vendor not found" });
            }
            return res.status(200).json({ message: "Vendor retrieved successfully", data: vendor });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    async showByUserId(req, res) {
        try {
            const vendor = await VendorService.getByUserId(req.params.userId);
            if (!vendor) {
                return res.status(404).json({ message: "Vendor profile not found" });
            }
            return res.status(200).json({ message: "Vendor profile retrieved successfully", data: vendor });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    async getMyApplication(req, res) {
        try {
            const userId = req.user.id;
            const application = await VendorService.getApplicationByUserId(userId);
            return res.status(200).json({
                message: "Vendor application retrieved successfully",
                data: { application }
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }
    }
}

export default new VendorController();