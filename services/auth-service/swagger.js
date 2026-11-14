import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ShopForge — Auth Service",
      version: "1.0.0",
      description: "Handles user registration, login, JWT token issuance and refresh.",
    },
    servers: [{ url: "http://localhost:3001", description: "Local Dev" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Happy Adebayo" },
            email: { type: "string", example: "happyadebayo2005@gmail.com" },
            role: { type: "string", enum: ["admin", "vendor", "user"], example: "admin" },
            vendorStatus: { type: "string", enum: ["none", "pending", "approved", "rejected"], example: "none" },
          },
        },
        AuthTokens: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        Error: {
          type: "object",
          properties: { message: { type: "string" } },
        },
      },
    },
    paths: {
      "/auth/signup": {
        post: {
          tags: ["Authentication"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password"],
                  properties: {
                    name: { type: "string", example: "John Doe" },
                    email: { type: "string", example: "john@example.com" },
                    password: { type: "string", example: "Password123!" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "User created", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthTokens" } } } },
            400: { description: "Validation error or email taken", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Login with email and password",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", example: "happyadebayo2005@gmail.com" },
                    password: { type: "string", example: "Password123!" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Login successful", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthTokens" } } } },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/auth/refresh": {
        post: {
          tags: ["Authentication"],
          summary: "Refresh access token using refresh token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["refreshToken"],
                  properties: { refreshToken: { type: "string" } },
                },
              },
            },
          },
          responses: {
            200: { description: "New tokens issued", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthTokens" } } } },
            401: { description: "Invalid or expired refresh token" },
          },
        },
      },
      "/auth/users/{id}": {
        get: {
          tags: ["Users"],
          summary: "Get user by ID",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          responses: {
            200: { description: "User found", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
            404: { description: "User not found" },
          },
        },
      },
    },
  },
  apis: [],
};

const spec = swaggerJsdoc(options);

export function setupSwagger(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(spec, {
    customSiteTitle: "Auth Service — ShopForge API",
    customCss: ".topbar { background-color: #131921; } .swagger-ui .topbar .topbar-wrapper img { content: url(''); } ",
  }));
  app.get("/api-docs.json", (req, res) => res.json(spec));
  console.log("[Auth Service] Swagger UI → http://localhost:3001/api-docs");
}
