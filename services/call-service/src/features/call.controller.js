import CallService from "./call.service.js";
import CallValidation from "./call.validation.js";

class CallController {

    async create(req, res) {

        try {

            const { error } = CallValidation.create(
                req.body
            );

            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const call = await CallService.create(
                req.user.id,
                req.body.vendorId,
                {
                    callerName: req.body.callerName || req.user.name || `User #${req.user.id}`,
                    vendorName: req.body.vendorName || `Vendor #${req.body.vendorId}`
                }
            );

            return res.status(201).json({
                message: "Call request created successfully",
                data: call
            });

        } catch (error) {

            return res.status(400).json({
                message: error.message
            });

        }
    }

    async index(req, res) {

        try {

            const calls = await CallService.getAll();

            return res.status(200).json({
                message: "Calls retrieved successfully",
                data: calls
            });

        } catch (error) {

            return res.status(400).json({
                message: error.message
            });

        }
    }

    async show(req, res) {

        try {

            const { error } = CallValidation.callId(
                req.params.id
            );

            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const call = await CallService.getById(
                req.params.id
            );

            return res.status(200).json({
                message: "Call retrieved successfully",
                data: call
            });

        } catch (error) {

            return res.status(404).json({
                message: error.message
            });

        }
    }

    async accept(req, res) {

        try {

            const { error } = CallValidation.callId(
                req.params.id
            );

            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const vendorId = req.user.vendorId || req.user.id;

            const call = await CallService.accept(
                req.params.id,
                vendorId
            );

            return res.status(200).json({
                message: "Call accepted successfully",
                data: call
            });

        } catch (error) {

            return res.status(400).json({
                message: error.message
            });

        }
    }

    async reject(req, res) {

        try {

            const { error } = CallValidation.callId(
                req.params.id
            );

            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const vendorId = req.user.vendorId || req.user.id;

            const call = await CallService.reject(
                req.params.id,
                vendorId
            );

            return res.status(200).json({
                message: "Call rejected successfully",
                data: call
            });

        } catch (error) {

            return res.status(400).json({
                message: error.message
            });

        }
    }

    async end(req, res) {

        try {

            const { error } = CallValidation.callId(
                req.params.id
            );

            if (error) {
                return res.status(400).json({
                    message: error.details[0].message
                });
            }

            const userId = req.user.role === "vendor" ? (req.user.vendorId || req.user.id) : req.user.id;

            const call = await CallService.end(
                req.params.id,
                userId,
                req.user.role
            );

            return res.status(200).json({
                message: "Call ended successfully",
                data: call
            });

        } catch (error) {

            return res.status(400).json({
                message: error.message
            });

        }
    }
}

export default new CallController();