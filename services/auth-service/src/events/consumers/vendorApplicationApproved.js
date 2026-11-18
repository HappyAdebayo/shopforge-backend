
import User from "../../features/auth/auth.model.js";
import retryMessage from "../../utils/retryMessage.js";
import configureRetryQueues from "../../config/retryQueues.js";
import logger from "../../config/logger.js";

const vendorApplicationApproved = async (channel) => {
    const queue = await channel.assertQueue(
        "auth-vendor-approved",
        {
            durable: true
        }
    );

    const { retryQueue, deadLetterQueue } =
        await configureRetryQueues(channel, queue.queue);

    await channel.bindQueue(
        queue.queue,
        "shopforge",
        "VendorApplicationApproved"
    );

    logger.info({ queue: queue.queue }, "Vendor approval consumer registered");

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
                    "Vendor application approved event received"
                );

                const user = await User.findByPk(data.userId);

                if (!user) {
                    const error = new Error(`User ${data.userId} not found`);

                    await retryMessage({
                        channel,
                        message,
                        retryQueue,
                        deadLetterQueue,
                        error,
                        permanent: true
                    });

                    return;
                }

                user.role = "vendor";
                user.vendorStatus = "approved";

                await user.save();

                channel.ack(message);

                logger.info(
                    { userId: data.userId },
                    "User role updated to vendor"
                );

            } catch (error) {
                logger.error(
                    { err: error },
                    "Error processing VendorApplicationApproved"
                );

                await retryMessage({
                    channel,
                    message,
                    retryQueue,
                    deadLetterQueue,
                    error,
                    permanent: error.name === "SyntaxError"
                });
            }
        }
    );
};

export default vendorApplicationApproved;