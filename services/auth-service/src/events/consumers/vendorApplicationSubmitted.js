
import User from "../../features/auth/auth.model.js";
import logger from "../../config/logger.js";

const vendorApplicationSubmitted = async (channel) => {
    const queue = await channel.assertQueue(
        "auth-service",
        {
            durable: true
        }
    );

    await channel.bindQueue(
        queue.queue,
        "shopforge",
        "VendorApplicationSubmitted"
    );

    logger.info(
        { queue: queue.queue },
        "Vendor application submission consumer registered"
    );

    channel.consume(
        queue.queue,
        async (message) => {
            if (!message) return;

            try {
                const data = JSON.parse(
                    message.content.toString()
                );

                const user = await User.findByPk(data.userId);

                if (!user) {
                    logger.error(
                        { userId: data.userId },
                        "User not found while processing vendor application"
                    );

                    channel.nack(message, false, false);

                    return;
                }

                user.vendorStatus = "pending";

                await user.save();

                channel.ack(message);

                logger.info(
                    { userId: data.userId },
                    "User vendor status updated to pending"
                );

            } catch (error) {
                logger.error(
                    { err: error },
                    "Error processing VendorApplicationSubmitted"
                );

                channel.nack(message, false, false);
            }
        }
    );
};

export default vendorApplicationSubmitted;
