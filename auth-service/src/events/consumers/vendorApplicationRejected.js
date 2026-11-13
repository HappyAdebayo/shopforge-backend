import User from "../../features/auth/auth.model.js";

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

    channel.consume(
        queue.queue,
        async (message) => {

            if (!message) return;

            try {

                const data = JSON.parse(
                    message.content.toString()
                );

                console.log(
                    "Vendor application rejected:",
                    data
                );

                const user = await User.findByPk(
                    data.userId
                );

                if (!user) {
                    console.error(
                        `User ${data.userId} not found`
                    );

                    channel.nack(
                        message,
                        false,
                        false
                    );

                    return;
                }

                user.role = "user";
                user.vendorStatus = "rejected";

                await user.save();

                channel.ack(message);

                console.log(
                    `User ${data.userId} vendor application rejected`
                );

            } catch (error) {

                console.error(
                    "Error processing VendorApplicationRejected:",
                    error
                );

                channel.nack(
                    message,
                    false,
                    false
                );
            }
        }
    );
};

export default vendorApplicationRejected;