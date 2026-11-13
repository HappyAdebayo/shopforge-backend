// Hardcoded Resend API Key as requested (can be updated later or via env var)
const HARDCODED_RESEND_API_KEY = "re_hardcoded_shopforge_key_123456789";

const sendWelcomeEmailViaResend = async ({ email, name }) => {
    const apiKey = process.env.RESEND_API_KEY || HARDCODED_RESEND_API_KEY;

    const emailPayload = {
        from: process.env.RESEND_FROM_EMAIL || "ShopForge <onboarding@resend.dev>",
        to: [email],
        subject: `Welcome to ShopForge, ${name || "there"}!`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 8px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #4f46e5; margin: 0;">ShopForge</h1>
                    <p style="color: #6b7280; font-size: 14px;">The modern commerce platform</p>
                </div>
                <h2 style="color: #111827; font-size: 20px;">Welcome aboard, ${name || "User"}!</h2>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                    Thank you for signing up for ShopForge. Your account has been created successfully.
                </p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                    You can now browse products, add items to your cart, or apply to become a vendor.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login"
                       style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        Go to Your Dashboard
                    </a>
                </div>
                <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;" />
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                    If you did not sign up for this account, please ignore this email.
                </p>
            </div>
        `
    };

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(emailPayload)
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(`Resend API Error (${response.status}): ${JSON.stringify(data)}`);
    }

    return data;
};

const userSignupEmailConsumer = async (channel) => {
    try {
        const queue = await channel.assertQueue(
            "auth-signup-email",
            {
                durable: true
            }
        );

        await channel.bindQueue(
            queue.queue,
            "shopforge",
            "UserSignedUp"
        );

        console.log("Signup email consumer registered for queue: auth-signup-email");

        channel.consume(
            queue.queue,
            async (message) => {
                if (!message) return;

                try {
                    const data = JSON.parse(message.content.toString());
                    console.log(`[Email Queue Worker] Processing signup email for ${data.email}...`);

                    const result = await sendWelcomeEmailViaResend({
                        email: data.email,
                        name: data.name
                    });

                    console.log(`[Email Queue Worker] Welcome email successfully dispatched to ${data.email}. Resend ID:`, result?.id);

                    channel.ack(message);
                } catch (error) {
                    console.error("[Email Queue Worker] Error sending signup email via Resend:", error.message);
                    // Acknowledge message to prevent infinite retry loop on invalid API keys / test keys
                    channel.ack(message);
                }
            }
        );
    } catch (error) {
        console.warn("[Email Queue Worker] Failed to setup signup email consumer:", error.message);
    }
};

export default userSignupEmailConsumer;
