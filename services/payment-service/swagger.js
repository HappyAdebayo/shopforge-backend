import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: { title: "ShopForge — Payment Service", version: "1.0.0", description: "Handles payment initialization, verification, webhooks and refunds. Supports Paystack, Flutterwave, Stripe, and Mock providers." },
    servers: [{ url: "http://localhost:3008", description: "Local Dev" }],
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
      schemas: {
        Payment: {
          type: "object",
          properties: {
            id: { type: "integer" }, reference: { type: "string", example: "SF-PAY-abc123" },
            orderId: { type: "integer" }, amount: { type: "string" }, currency: { type: "string", default: "NGN" },
            status: { type: "string", enum: ["pending", "success", "failed", "refunded"] },
            provider: { type: "string", enum: ["paystack", "flutterwave", "stripe", "mock"] },
            checkoutUrl: { type: "string", description: "Redirect URL to complete payment" },
          },
        },
        Error: { type: "object", properties: { message: { type: "string" } } },
      },
    },
    paths: {
      "/payments/providers": {
        get: { tags: ["Payments"], summary: "Get list of supported payment providers (public)", responses: { 200: { description: "Provider list" } } },
      },
      "/payments/initialize": {
        post: {
          tags: ["Payments"], summary: "Initialize payment for an order", security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object", required: ["orderId", "provider"],
                  properties: {
                    orderId: { type: "integer", example: 1 },
                    provider: { type: "string", enum: ["paystack", "flutterwave", "stripe", "mock"], example: "paystack" },
                    callbackUrl: { type: "string", example: "http://localhost:3000/checkout/success" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Payment initialized with checkout URL", content: { "application/json": { schema: { $ref: "#/components/schemas/Payment" } } } } },
        },
      },
      "/payments/verify": {
        post: {
          tags: ["Payments"], summary: "Verify payment by reference (POST)",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["reference"], properties: { reference: { type: "string" } } } } } },
          responses: { 200: { description: "Payment verification result" } },
        },
      },
      "/payments/verify/{reference}": {
        get: {
          tags: ["Payments"], summary: "Verify payment by reference (GET)",
          parameters: [{ in: "path", name: "reference", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Payment status" } },
        },
      },
      "/payments/webhook/{provider}": {
        post: {
          tags: ["Webhooks"], summary: "Payment provider webhook endpoint",
          parameters: [{ in: "path", name: "provider", required: true, schema: { type: "string", enum: ["paystack", "flutterwave", "stripe", "mock"] } }],
          responses: { 200: { description: "Webhook processed" } },
        },
      },
      "/payments/{reference}": {
        get: {
          tags: ["Payments"], summary: "Get payment by reference", security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "reference", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Payment details", content: { "application/json": { schema: { $ref: "#/components/schemas/Payment" } } } }, 404: { description: "Not found" } },
        },
      },
      "/payments/order/{orderId}": {
        get: {
          tags: ["Payments"], summary: "Get payment by order ID", security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "orderId", required: true, schema: { type: "integer" } }],
          responses: { 200: { description: "Payment details" } },
        },
      },
      "/payments/{reference}/refund": {
        post: {
          tags: ["Payments"], summary: "Refund a payment", security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "reference", required: true, schema: { type: "string" } }],
          requestBody: { content: { "application/json": { schema: { type: "object", properties: { reason: { type: "string" } } } } } },
          responses: { 200: { description: "Refund initiated" } },
        },
      },
    },
  },
  apis: [],
};

const spec = swaggerJsdoc(options);
export function setupSwagger(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(spec, { customSiteTitle: "Payment Service — ShopForge API" }));
  app.get("/api-docs.json", (req, res) => res.json(spec));
  console.log("[Payment Service] Swagger UI → http://localhost:3008/api-docs");
}
