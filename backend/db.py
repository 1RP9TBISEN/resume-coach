import sqlite3
from pathlib import Path
from typing import List, Optional, Dict, Any

# Ensure database path is always backend/app.db regardless of current working directory
DB_PATH = Path(__file__).resolve().parent / "app.db"


def get_db_connection() -> sqlite3.Connection:
    """Creates a database connection with dict-like row access."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initializes tables and seeds initial data if the database is empty."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create the items table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            done BOOLEAN NOT NULL DEFAULT 0
        )
        """
    )
    conn.commit()

    # Check if empty, seed default items if so
    cursor.execute("SELECT COUNT(*) AS count FROM items")
    row = cursor.fetchone()
    if row and row["count"] == 0:
        seed_items = [
            ("Brainstorm hackathon project pitch", 1),
            ("Build FastAPI backend & React frontend", 1),
            ("Rehearse 2-minute demo with judges", 0),
        ]
        cursor.executemany(
            "INSERT INTO items (title, done) VALUES (?, ?)",
            seed_items,
        )
        conn.commit()

    conn.close()


def get_all_items() -> List[Dict[str, Any]]:
    """Retrieve all items ordered by id."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, done FROM items ORDER BY id ASC")
    rows = cursor.fetchall()
    items = [
        {"id": row["id"], "title": row["title"], "done": bool(row["done"])}
        for row in rows
    ]
    conn.close()
    return items


def get_item_by_id(item_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve a single item by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, done FROM items WHERE id = ?", (item_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {"id": row["id"], "title": row["title"], "done": bool(row["done"])}


def create_item(title: str) -> Dict[str, Any]:
    """Insert a new item and return it."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO items (title, done) VALUES (?, 0)",
        (title.strip(),),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return {"id": new_id, "title": title.strip(), "done": False}


def update_item(
    item_id: int,
    title: Optional[str] = None,
    done: Optional[bool] = None,
) -> Optional[Dict[str, Any]]:
    """Update title and/or done status of an existing item."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, done FROM items WHERE id = ?", (item_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    current_title = row["title"] if title is None else title.strip()
    current_done = row["done"] if done is None else (1 if done else 0)

    cursor.execute(
        "UPDATE items SET title = ?, done = ? WHERE id = ?",
        (current_title, current_done, item_id),
    )
    conn.commit()
    conn.close()

    return {"id": item_id, "title": current_title, "done": bool(current_done)}


def delete_item(item_id: int) -> bool:
    """Delete an item by ID. Returns True if deleted, False if not found."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM items WHERE id = ?", (item_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted
