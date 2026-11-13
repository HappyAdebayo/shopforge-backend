# ShopForge Recommendation Service

FastAPI recommendation microservice running on port **3009**.

## Overview
This service provides recommendation endpoints for the ShopForge e-commerce platform:
- Connects directly to the product SQLite database (`shopforge-backend/product-service/database.sqlite`).
- On startup, attempts to load the trained offline ML model (`shopforge-dataset/models/best_recommender_model.joblib`).
- Features robust fallback strategies when the ML model cannot load or when user history is cold-start.
- Supports both direct requests and proxied requests through the Next.js frontend rewrites (`/api/recommendations/*`).

## Endpoints

- `GET /health`  
  Health check returning service and ML model status:  
  `{"status": "ok", "model_loaded": true|false}`

- `GET /recommendations/popular?n=10&exclude_ids=1,2,3`  
  Returns ShopForge product objects sorted by total interactions in `product_interactions`, falling back to random active products if insufficient interactions exist.

- `GET /recommendations/similar/{product_id}?n=8`  
  Returns products similar to the given product (same category ranked by interaction count, excluding the current product).

- `GET /recommendations/user/{user_id}?n=10`  
  Personalized recommendations based on the user's interaction history in `product_interactions` (identifies most-viewed categories and returns top products from those categories not yet interacted with, falling back to popular).

## Starting the Service

Run the startup script:
```bash
./start.sh
```
Or manually:
```bash
./venv/bin/uvicorn main:app --host 0.0.0.0 --port 3009 --reload
```
