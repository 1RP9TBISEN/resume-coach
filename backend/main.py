from contextlib import asynccontextmanager
from typing import Optional, List
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import db


# ---------------------------------------------------------
# Lifecycle & Database Initialization
# ---------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure SQLite database and seed items exist on startup
    db.init_db()
    yield


app = FastAPI(
    title="Hackathon Starter API",
    description="FastAPI + SQLite backend for rapid hackathon prototyping",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------
# CORS Configuration (Allows all origins for easy 2-laptop demos)
# ---------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Pydantic Request Models
# ---------------------------------------------------------
class ItemCreate(BaseModel):
    title: str


class ItemUpdate(BaseModel):
    title: Optional[str] = None
    done: Optional[bool] = None


# ---------------------------------------------------------
# Health Check Endpoint
# ---------------------------------------------------------
@app.get("/api/health")
def health_check():
    """Health check to confirm backend is running."""
    return {"status": "ok"}


# ---------------------------------------------------------
# Example Resource: Items (CRUD)
# ---------------------------------------------------------
@app.get("/api/items")
def list_items():
    """Retrieve all items."""
    return db.get_all_items()


@app.post("/api/items", status_code=status.HTTP_201_CREATED)
def add_item(payload: ItemCreate):
    """Create a new item."""
    if not payload.title.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title cannot be empty.",
        )
    return db.create_item(payload.title)


@app.put("/api/items/{item_id}")
def edit_item(item_id: int, payload: ItemUpdate):
    """Update title and/or done status of an item."""
    updated = db.update_item(item_id, title=payload.title, done=payload.done)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item {item_id} not found.",
        )
    return updated


@app.delete("/api/items/{item_id}")
def remove_item(item_id: int):
    """Delete an item by ID."""
    deleted = db.delete_item(item_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item {item_id} not found.",
        )
    return {"status": "deleted", "id": item_id}


# =========================================================
# ADD YOUR NEW ROUTES BELOW THIS LINE
# Example:
# @app.get("/api/predict")
# def predict():
#     return {"result": "example"}
# =========================================================
