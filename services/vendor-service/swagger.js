import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: { title: "ShopForge — Vendor Service", version: "1.0.0", description: "Manages vendor applications, approval, and vendor profiles." },
    servers: [{ url: "http://localhost:3002", description: "Local Dev" }],
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
      schemas: {
        VendorApplication: {
          type: "object",
          properties: {
            id: { type: "integer" },
            userId: { type: "integer" },
            businessName: { type: "string", example: "TechVault" },
            description: { type: "string" },
            status: { type: "string", enum: ["pending", "approved", "rejected"] },
          },
        },
        Error: { type: "object", properties: { message: { type: "string" } } },
      },
    },
    paths: {
      "/vendors/apply": {
        post: {
          tags: ["Vendor Applications"],
          summary: "Apply to become a vendor (user role required)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["businessName", "description"],
                  properties: {
                    businessName: { type: "string", example: "My Store" },
                    description: { type: "string", example: "We sell premium goods" },
                    logoUrl: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Application submitted" },
            400: { description: "Validation error" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/vendors/applications/my": {
        get: {
          tags: ["Vendor Applications"],
          summary: "Get my own vendor application status",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Application details", content: { "application/json": { schema: { $ref: "#/components/schemas/VendorApplication" } } } } },
        },
      },
      "/vendors/applications": {
        get: {
          tags: ["Admin"],
          summary: "List all vendor applications (admin only)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "query", name: "status", schema: { type: "string", enum: ["pending", "approved", "rejected"] } },
            { in: "query", name: "page", schema: { type: "integer", default: 1 } },
            { in: "query", name: "limit", schema: { type: "integer", default: 20 } },
          ],
          responses: { 200: { description: "List of applications" } },
        },
      },
      "/vendors/applications/{id}/approve": {
        patch: {
          tags: ["Admin"],
          summary: "Approve a vendor application (admin only)",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          responses: { 200: { description: "Application approved" }, 404: { description: "Not found" } },
        },
      },
      "/vendors/applications/{id}/reject": {
        patch: {
          tags: ["Admin"],
          summary: "Reject a vendor application (admin only)",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          requestBody: { content: { "application/json": { schema: { type: "object", properties: { reason: { type: "string" } } } } } },
          responses: { 200: { description: "Application rejected" } },
        },
      },
      "/vendors/user/{userId}": {
        get: {
          tags: ["Vendors"],
          summary: "Get vendor profile by user ID (public)",
          parameters: [{ in: "path", name: "userId", required: true, schema: { type: "integer" } }],
          responses: { 200: { description: "Vendor profile" }, 404: { description: "Not found" } },
        },
      },
      "/vendors/{id}": {
        get: {
          tags: ["Vendors"],
          summary: "Get vendor profile by vendor ID (public)",
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          responses: { 200: { description: "Vendor profile" }, 404: { description: "Not found" } },
        },
      },
    },
  },
  apis: [],
};

const spec = swaggerJsdoc(options);

export function setupSwagger(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(spec, { customSiteTitle: "Vendor Service — ShopForge API" }));
  app.get("/api-docs.json", (req, res) => res.json(spec));
  console.log("[Vendor Service] Swagger UI → http://localhost:3002/api-docs");
}
