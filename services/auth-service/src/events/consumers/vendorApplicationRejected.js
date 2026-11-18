
import User from "../../features/auth/auth.model.js";
import logger from "../../config/logger.js";

const vendorApplicationRejected = async (channel) => {
    const queue = await channel.assertQueue(
        "auth-vendor-rejected",
        {
            durable: true
        }
    );

    await channel.bindQueue(
        queue.queue,
        "shopforge",
        "VendorApplicationRejected"
    );

    logger.info(
        { queue: queue.queue },
        "Vendor rejection consumer registered"
    );

    channel.consume(
        queue.queue,
        async (message) => {
            if (!message) return;

            try {
                const data = JSON.parse(
                    message.content.toString()
                );

                logger.info(
                    { userId: data.userId },
                    "Vendor application rejected event received"
                );

                const user = await User.findByPk(data.userId);

                if (!user) {
                    logger.error(
                        { userId: data.userId },
                        "User not found while processing vendor rejection"
                    );

                    channel.nack(message, false, false);

                    return;
                }

                user.role = "user";
                user.vendorStatus = "rejected";

                await user.save();

                channel.ack(message);

                logger.info(
                    { userId: data.userId },
                    "User vendor application rejected"
                );

            } catch (error) {
                logger.error(
                    { err: error },
                    "Error processing VendorApplicationRejected"
                );

                channel.nack(message, false, false);
            }
        }
    );
};

export default vendorApplicationRejected;
