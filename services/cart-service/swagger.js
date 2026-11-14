import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: { title: "ShopForge — Cart Service", version: "1.0.0", description: "Manages shopping cart — add, update, remove items. All routes require authentication." },
    servers: [{ url: "http://localhost:3006", description: "Local Dev" }],
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
      schemas: {
        CartItem: {
          type: "object",
          properties: { id: { type: "integer" }, productId: { type: "integer" }, name: { type: "string" }, price: { type: "string" }, quantity: { type: "integer" }, stock: { type: "integer" }, imageUrl: { type: "string" } },
        },
        Cart: {
          type: "object",
          properties: { id: { type: "integer" }, userId: { type: "integer" }, items: { type: "array", items: { $ref: "#/components/schemas/CartItem" } }, itemCount: { type: "integer" }, subtotal: { type: "string" } },
        },
        Error: { type: "object", properties: { message: { type: "string" } } },
      },
    },
    paths: {
      "/cart": {
        get: { tags: ["Cart"], summary: "Get current user's cart", security: [{ bearerAuth: [] }], responses: { 200: { description: "Cart with items", content: { "application/json": { schema: { $ref: "#/components/schemas/Cart" } } } } } },
        delete: { tags: ["Cart"], summary: "Clear entire cart", security: [{ bearerAuth: [] }], responses: { 200: { description: "Cart cleared" } } },
      },
      "/cart/subtotal": {
        get: { tags: ["Cart"], summary: "Get cart subtotal and item count", security: [{ bearerAuth: [] }], responses: { 200: { description: "Subtotal info", content: { "application/json": { schema: { type: "object", properties: { subtotal: { type: "string" }, itemCount: { type: "integer" } } } } } } },
        },
      },
      "/cart/validate": {
        get: { tags: ["Cart"], summary: "Validate cart items for stock availability", security: [{ bearerAuth: [] }], responses: { 200: { description: "Validation result" } } },
        post: { tags: ["Cart"], summary: "Validate cart items (POST version)", security: [{ bearerAuth: [] }], responses: { 200: { description: "Validation result" } } },
      },
      "/cart/items": {
        post: {
          tags: ["Cart"], summary: "Add item to cart", security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["productId", "quantity"], properties: { productId: { type: "integer", example: 5 }, quantity: { type: "integer", example: 1 } } } } } },
          responses: { 200: { description: "Item added, updated cart returned" }, 400: { description: "Out of stock or validation error" } },
        },
      },
      "/cart/items/{id}": {
        patch: {
          tags: ["Cart"], summary: "Update item quantity", security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" }, description: "Cart item ID" }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["quantity"], properties: { quantity: { type: "integer", example: 3 } } } } } },
          responses: { 200: { description: "Quantity updated" } },
        },
        delete: {
          tags: ["Cart"], summary: "Remove item from cart", security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          responses: { 200: { description: "Item removed" } },
        },
      },
    },
  },
  apis: [],
};

const spec = swaggerJsdoc(options);
export function setupSwagger(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(spec, { customSiteTitle: "Cart Service — ShopForge API" }));
  app.get("/api-docs.json", (req, res) => res.json(spec));
  console.log("[Cart Service] Swagger UI → http://localhost:3006/api-docs");
}
