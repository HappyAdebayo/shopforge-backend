import User from "../../features/auth/auth.model.js";

const vendorApplicationApproved = async (channel) => {

    const queue = await channel.assertQueue(
        "auth-vendor-approved",
        {
            durable: true
        }
    );

    await channel.bindQueue(
        queue.queue,
        "shopforge",
        "VendorApplicationApproved"
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
                    "Vendor application approved:",
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

                user.role = "vendor";
                user.vendorStatus = "approved";

                await user.save();

                channel.ack(message);

                console.log(
                    `User ${data.userId} is now a vendor`
                );

            } catch (error) {

                console.error(
                    "Error processing VendorApplicationApproved:",
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

export default vendorApplicationApproved;