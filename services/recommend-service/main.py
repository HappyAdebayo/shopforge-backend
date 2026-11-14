import os
import sys
import sqlite3
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Optional, List

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("recommend-service")

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR.parent / "product-service" / "database.sqlite"
DATASET_DIR = BASE_DIR.parent.parent / "shopforge-dataset"
MODEL_PATH = DATASET_DIR / "models" / "best_recommender_model.joblib"

# Global state for ML model
ml_model = None
model_loaded = False


def try_load_model():
    global ml_model, model_loaded
    try:
        if DATASET_DIR.exists() and str(DATASET_DIR) not in sys.path:
            sys.path.insert(0, str(DATASET_DIR))

        if MODEL_PATH.exists():
            import joblib
            ml_model = joblib.load(str(MODEL_PATH))
            model_loaded = True
            logger.info("Successfully loaded ML model: %s", getattr(ml_model, "name", type(ml_model).__name__))
        else:
            logger.warning("ML model file not found at %s. Using SQLite recommendation logic.", MODEL_PATH)
            model_loaded = False
    except Exception as exc:
        logger.warning("Could not load ML model (%s). Gracefully falling back to SQLite recommendations.", exc)
        ml_model = None
        model_loaded = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Try to load model
    try_load_model()
    yield
    # Shutdown: clean up if needed
    logger.info("Recommendation service shutting down.")


app = FastAPI(
    title="ShopForge Recommendation Service",
    description="Microservice providing personalized, similar, and popular product recommendations",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models matching ShopForge frontend TypeScript Product type
class ProductImageResponse(BaseModel):
    id: int
    imageUrl: str = ""
    isPrimary: bool = False

    class Config:
        populate_by_name = True


class ProductResponse(BaseModel):
    id: int
    name: str
    price: str
    stock: int
    status: str
    categoryId: int
    vendorId: int
    images: List[ProductImageResponse] = []


def get_db():
    if not DB_PATH.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Product database not found at {DB_PATH}",
        )
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def fetch_products_with_images(conn: sqlite3.Connection, product_ids: List[int]) -> List[dict]:
    if not product_ids:
        return []

    cursor = conn.cursor()
    placeholders = ",".join("?" for _ in product_ids)

    # 1. Fetch products
    cursor.execute(
        f"""
        SELECT id, vendorId, categoryId, name, description, price, stock, status
        FROM products
        WHERE id IN ({placeholders}) AND status = 'active'
        """,
        product_ids,
    )
    product_dict = {row["id"]: row for row in cursor.fetchall()}

    # 2. Fetch images for all matched products
    cursor.execute(
        f"""
        SELECT id, productId, imageUrl, isPrimary
        FROM product_images
        WHERE productId IN ({placeholders})
        ORDER BY isPrimary DESC, id ASC
        """,
        product_ids,
    )
    images_by_product = {}
    for img_row in cursor.fetchall():
        pid = img_row["productId"]
        if pid not in images_by_product:
            images_by_product[pid] = []
        images_by_product[pid].append({
            "id": img_row["id"],
            "imageUrl": img_row["imageUrl"],
            "isPrimary": bool(img_row["isPrimary"]),
        })

    # 3. Assemble products in the order of product_ids
    result = []
    for pid in product_ids:
        if pid in product_dict:
            p = product_dict[pid]
            result.append({
                "id": p["id"],
                "name": p["name"],
                "price": str(p["price"]),
                "stock": int(p["stock"]),
                "status": str(p["status"]),
                "categoryId": int(p["categoryId"]),
                "vendorId": int(p["vendorId"]),
                "images": images_by_product.get(pid, []),
            })
    return result


def get_popular_ids(conn: sqlite3.Connection, n: int = 10, exclude_ids: Optional[set] = None) -> List[int]:
    exclude_ids = exclude_ids or set()
    cursor = conn.cursor()

    # Query products sorted by interaction count from product_interactions
    cursor.execute(
        """
        SELECT p.id, COUNT(pi.id) as interactions_count
        FROM products p
        LEFT JOIN product_interactions pi ON p.id = pi.product_id
        WHERE p.status = 'active'
        GROUP BY p.id
        HAVING interactions_count > 0
        ORDER BY interactions_count DESC
        """
    )
    interaction_rows = cursor.fetchall()
    selected = []
    for row in interaction_rows:
        pid = row["id"]
        if pid not in exclude_ids:
            selected.append(pid)
            if len(selected) >= n:
                return selected

    # Fall back to random active products if no interactions or insufficient count
    needed = n - len(selected)
    all_excluded = exclude_ids | set(selected)
    if all_excluded:
        placeholders = ",".join("?" for _ in all_excluded)
        cursor.execute(
            f"""
            SELECT id FROM products
            WHERE status = 'active' AND id NOT IN ({placeholders})
            ORDER BY RANDOM()
            LIMIT ?
            """,
            (*list(all_excluded), needed),
        )
    else:
        cursor.execute(
            """
            SELECT id FROM products
            WHERE status = 'active'
            ORDER BY RANDOM()
            LIMIT ?
            """,
            (needed,),
        )

    for row in cursor.fetchall():
        selected.append(row["id"])

    return selected


def get_similar_ids(conn: sqlite3.Connection, product_id: int, n: int = 8) -> List[int]:
    cursor = conn.cursor()
    cursor.execute("SELECT categoryId FROM products WHERE id = ?", (product_id,))
    row = cursor.fetchone()

    if not row:
        # Product doesn't exist, fallback to popular excluding this id
        return get_popular_ids(conn, n=n, exclude_ids={product_id})

    category_id = row["categoryId"]

    # Same category products ranked by interaction count, excluding current product
    cursor.execute(
        """
        SELECT p.id, COUNT(pi.id) as interactions_count
        FROM products p
        LEFT JOIN product_interactions pi ON p.id = pi.product_id
        WHERE p.categoryId = ? AND p.id != ? AND p.status = 'active'
        GROUP BY p.id
        ORDER BY interactions_count DESC, RANDOM()
        LIMIT ?
        """,
        (category_id, product_id, n),
    )
    similar_ids = [r["id"] for r in cursor.fetchall()]

    # If category has fewer than n products, fill with popular active products
    if len(similar_ids) < n:
        excluded = {product_id} | set(similar_ids)
        fallback = get_popular_ids(conn, n=n - len(similar_ids), exclude_ids=excluded)
        similar_ids.extend(fallback)

    return similar_ids


def get_user_ids(conn: sqlite3.Connection, user_id: int, n: int = 10) -> List[int]:
    cursor = conn.cursor()

    # User's interacted products
    cursor.execute(
        "SELECT DISTINCT product_id FROM product_interactions WHERE user_id = ?",
        (user_id,),
    )
    user_interacted = {r["product_id"] for r in cursor.fetchall()}

    # User's most-viewed/interacted categories
    cursor.execute(
        """
        SELECT p.categoryId, COUNT(*) as cat_count
        FROM product_interactions pi
        JOIN products p ON pi.product_id = p.id
        WHERE pi.user_id = ?
        GROUP BY p.categoryId
        ORDER BY cat_count DESC
        """,
        (user_id,),
    )
    cat_rows = cursor.fetchall()

    if not cat_rows:
        # Cold-start user: fallback to popular
        return get_popular_ids(conn, n=n, exclude_ids=user_interacted)

    selected = []
    for cat_row in cat_rows:
        cat_id = cat_row["categoryId"]
        remaining = n - len(selected)
        if remaining <= 0:
            break

        all_excluded = user_interacted | set(selected)
        if all_excluded:
            placeholders = ",".join("?" for _ in all_excluded)
            cursor.execute(
                f"""
                SELECT p.id, COUNT(pi.id) as interactions_count
                FROM products p
                LEFT JOIN product_interactions pi ON p.id = pi.product_id
                WHERE p.categoryId = ? AND p.id NOT IN ({placeholders}) AND p.status = 'active'
                GROUP BY p.id
                ORDER BY interactions_count DESC, RANDOM()
                LIMIT ?
                """,
                (cat_id, *list(all_excluded), remaining),
            )
        else:
            cursor.execute(
                """
                SELECT p.id, COUNT(pi.id) as interactions_count
                FROM products p
                LEFT JOIN product_interactions pi ON p.id = pi.product_id
                WHERE p.categoryId = ? AND p.status = 'active'
                GROUP BY p.id
                ORDER BY interactions_count DESC, RANDOM()
                LIMIT ?
                """,
                (cat_id, remaining),
            )

        for r in cursor.fetchall():
            selected.append(r["id"])

    # If still fewer than n, fill with popular active products
    if len(selected) < n:
        excluded = user_interacted | set(selected)
        fallback = get_popular_ids(conn, n=n - len(selected), exclude_ids=excluded)
        selected.extend(fallback)

    return selected


# ─── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
@app.get("/recommendations/health")
def health_check():
    return {
        "status": "ok",
        "model_loaded": model_loaded,
    }


@app.get("/recommendations/popular")
@app.get("/popular")
def get_popular_recommendations(
    n: int = 10,
    exclude_ids: Optional[str] = None,
):
    exclude_set = set()
    if isinstance(exclude_ids, str) and exclude_ids:
        for x in exclude_ids.split(","):
            x_clean = x.strip()
            if x_clean.isdigit():
                exclude_set.add(int(x_clean))

    conn = get_db()
    try:
        product_ids = get_popular_ids(conn, n=int(n), exclude_ids=exclude_set)
        return fetch_products_with_images(conn, product_ids)
    finally:
        conn.close()


@app.get("/recommendations/similar/{product_id}")
@app.get("/similar/{product_id}")
def get_similar_recommendations(
    product_id: int,
    n: int = 8,
):
    conn = get_db()
    try:
        product_ids = get_similar_ids(conn, product_id=int(product_id), n=int(n))
        return fetch_products_with_images(conn, product_ids)
    finally:
        conn.close()


@app.get("/recommendations/user/{user_id}")
@app.get("/user/{user_id}")
def get_user_recommendations(
    user_id: int,
    n: int = 10,
):
    conn = get_db()
    try:
        product_ids = get_user_ids(conn, user_id=int(user_id), n=int(n))
        return fetch_products_with_images(conn, product_ids)
    finally:
        conn.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=3009, reload=True)
