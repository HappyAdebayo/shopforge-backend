import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: { title: "ShopForge — Product Service", version: "1.0.0", description: "Manages products, categories, reviews, and user interactions." },
    servers: [{ url: "http://localhost:3003", description: "Local Dev" }],
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
      schemas: {
        Product: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "ProMax Wireless Earbuds" },
            description: { type: "string" },
            price: { type: "string", example: "79.99" },
            stock: { type: "integer", example: 150 },
            status: { type: "string", enum: ["active", "inactive"], example: "active" },
            categoryId: { type: "integer", example: 1 },
            vendorId: { type: "integer", example: 28 },
            images: { type: "array", items: { type: "object", properties: { id: { type: "integer" }, imageUrl: { type: "string" }, isPrimary: { type: "boolean" } } } },
          },
        },
        Category: {
          type: "object",
          properties: { id: { type: "integer" }, name: { type: "string", example: "Electronics" }, description: { type: "string" } },
        },
        Review: {
          type: "object",
          properties: { id: { type: "integer" }, rating: { type: "integer", minimum: 1, maximum: 5 }, title: { type: "string" }, comment: { type: "string" } },
        },
        Error: { type: "object", properties: { message: { type: "string" } } },
      },
    },
    paths: {
      "/products": {
        get: {
          tags: ["Products"],
          summary: "List all products (public)",
          parameters: [
            { in: "query", name: "categoryId", schema: { type: "integer" } },
            { in: "query", name: "search", schema: { type: "string" } },
            { in: "query", name: "page", schema: { type: "integer", default: 1 } },
            { in: "query", name: "limit", schema: { type: "integer", default: 20 } },
          ],
          responses: { 200: { description: "Paginated product list" } },
        },
        post: {
          tags: ["Products"],
          summary: "Create product (vendor only)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "price", "stock", "categoryId"],
                  properties: {
                    name: { type: "string" }, description: { type: "string" },
                    price: { type: "number", example: 29.99 }, stock: { type: "integer", example: 100 },
                    categoryId: { type: "integer" }, images: { type: "array", items: { type: "object", properties: { imageUrl: { type: "string" }, isPrimary: { type: "boolean" } } } },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Product created" }, 400: { description: "Validation error" } },
        },
      },
      "/products/my-products": {
        get: {
          tags: ["Products"],
          summary: "Get vendor's own products (vendor only)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "query", name: "page", schema: { type: "integer", default: 1 } },
            { in: "query", name: "limit", schema: { type: "integer", default: 20 } },
          ],
          responses: { 200: { description: "Vendor's products" } },
        },
      },
      "/products/admin/count": {
        get: { tags: ["Admin"], summary: "Get total product count (admin only)", security: [{ bearerAuth: [] }], responses: { 200: { description: "Count returned" } } },
      },
      "/products/{id}": {
        get: {
          tags: ["Products"], summary: "Get product by ID (public)",
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          responses: { 200: { description: "Product found", content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } }, 404: { description: "Not found" } },
        },
        put: {
          tags: ["Products"], summary: "Update product (vendor only)", security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
          responses: { 200: { description: "Updated" }, 403: { description: "Forbidden" } },
        },
        delete: {
          tags: ["Products"], summary: "Delete product (vendor only)", security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
          responses: { 200: { description: "Deleted" } },
        },
      },
      "/products/{productId}/reviews": {
        get: {
          tags: ["Reviews"], summary: "List reviews for a product (public)",
          parameters: [{ in: "path", name: "productId", required: true, schema: { type: "integer" } }, { in: "query", name: "page", schema: { type: "integer" } }],
          responses: { 200: { description: "Review list with stats" } },
        },
        post: {
          tags: ["Reviews"], summary: "Add review to product (auth required)", security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "productId", required: true, schema: { type: "integer" } }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["rating", "comment"], properties: { rating: { type: "integer", minimum: 1, maximum: 5 }, title: { type: "string" }, comment: { type: "string" } } } } } },
          responses: { 201: { description: "Review submitted" } },
        },
      },
      "/products/reviews/{reviewId}": {
        delete: {
          tags: ["Reviews"], summary: "Delete a review (owner or admin)", security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "reviewId", required: true, schema: { type: "integer" } }],
          responses: { 200: { description: "Review deleted" } },
        },
      },
      "/categories": {
        get: { tags: ["Categories"], summary: "List all categories (public)", responses: { 200: { description: "Category list" } } },
        post: { tags: ["Categories"], summary: "Create category (admin only)", security: [{ bearerAuth: [] }], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Category" } } } }, responses: { 201: { description: "Created" } } },
      },
      "/categories/{id}": {
        get: { tags: ["Categories"], summary: "Get category by ID (admin only)", security: [{ bearerAuth: [] }], parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Category" } } },
        delete: { tags: ["Categories"], summary: "Delete category (admin only)", security: [{ bearerAuth: [] }], parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Deleted" } } },
      },
      "/interactions": {
        post: { tags: ["Interactions"], summary: "Record a product interaction (view/addtocart/transaction)", requestBody: { content: { "application/json": { schema: { type: "object", required: ["productId", "event"], properties: { productId: { type: "integer" }, event: { type: "string", enum: ["view", "addtocart", "transaction"] } } } } } }, responses: { 201: { description: "Recorded" } } },
      },
      "/interactions/my": {
        get: { tags: ["Interactions"], summary: "Get my interaction history", security: [{ bearerAuth: [] }], responses: { 200: { description: "Interaction list" } } },
      },
      "/interactions/product/{productId}/stats": {
        get: { tags: ["Interactions"], summary: "Get interaction stats for a product (public)", parameters: [{ in: "path", name: "productId", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Stats" } } },
      },
    },
  },
  apis: [],
};

const spec = swaggerJsdoc(options);
export function setupSwagger(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(spec, { customSiteTitle: "Product Service — ShopForge API" }));
  app.get("/api-docs.json", (req, res) => res.json(spec));
  console.log("[Product Service] Swagger UI → http://localhost:3003/api-docs");
}
