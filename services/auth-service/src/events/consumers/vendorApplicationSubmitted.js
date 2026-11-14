import User from "../../features/auth/auth.model.js";

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

    channel.consume(
        queue.queue,
        async (message) => {

            if (!message) return;

            try {

                const data = JSON.parse(
                    message.content.toString()
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

                user.vendorStatus = "pending";

                await user.save();

                channel.ack(message);

                console.log(
                    `User ${data.userId} vendor status updated to pending`
                );

            } catch (error) {

                console.error(
                    "Error processing VendorApplicationSubmitted:",
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

export default vendorApplicationSubmitted;