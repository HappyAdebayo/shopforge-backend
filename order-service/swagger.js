import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: { title: "ShopForge — Order Service", version: "1.0.0", description: "Manages order creation, status tracking, and cancellations." },
    servers: [{ url: "http://localhost:3007", description: "Local Dev" }],
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
      schemas: {
        Order: {
          type: "object",
          properties: {
            id: { type: "integer" }, orderNumber: { type: "string", example: "SF-20241113-0001" },
            userId: { type: "integer" }, status: { type: "string", enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] },
            totalAmount: { type: "string" }, shippingAddress: { type: "object" }, items: { type: "array" },
          },
        },
        Error: { type: "object", properties: { message: { type: "string" } } },
      },
    },
    paths: {
      "/orders": {
        post: {
          tags: ["Orders"], summary: "Create a new order", security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["shippingAddress"],
                  properties: {
                    shippingAddress: { type: "object", required: ["street", "city", "state"], properties: { street: { type: "string", example: "12 Allen Avenue" }, city: { type: "string", example: "Lagos" }, state: { type: "string", example: "Lagos" }, country: { type: "string", default: "Nigeria" } } },
                    paymentMethod: { type: "string", enum: ["paystack", "flutterwave", "stripe", "mock"], default: "paystack" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Order created successfully" }, 400: { description: "Empty cart or validation error" } },
        },
        get: {
          tags: ["Orders"], summary: "List orders (own orders for users, all for admin)", security: [{ bearerAuth: [] }],
          parameters: [
            { in: "query", name: "page", schema: { type: "integer", default: 1 } },
            { in: "query", name: "limit", schema: { type: "integer", default: 20 } },
            { in: "query", name: "status", schema: { type: "string", enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] } },
          ],
          responses: { 200: { description: "Order list" } },
        },
      },
      "/orders/{id}": {
        get: {
          tags: ["Orders"], summary: "Get order by ID", security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          responses: { 200: { description: "Order details", content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } }, 404: { description: "Not found" } },
        },
      },
      "/orders/{id}/status": {
        patch: {
          tags: ["Orders"], summary: "Update order status (admin/vendor)", security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["confirmed", "processing", "shipped", "delivered"] } } } } } },
          responses: { 200: { description: "Status updated" } },
        },
      },
      "/orders/{id}/cancel": {
        post: {
          tags: ["Orders"], summary: "Cancel an order", security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          requestBody: { content: { "application/json": { schema: { type: "object", properties: { reason: { type: "string" } } } } } },
          responses: { 200: { description: "Order cancelled" }, 400: { description: "Cannot cancel at this stage" } },
        },
      },
    },
  },
  apis: [],
};

const spec = swaggerJsdoc(options);
export function setupSwagger(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(spec, { customSiteTitle: "Order Service — ShopForge API" }));
  app.get("/api-docs.json", (req, res) => res.json(spec));
  console.log("[Order Service] Swagger UI → http://localhost:3007/api-docs");
}
