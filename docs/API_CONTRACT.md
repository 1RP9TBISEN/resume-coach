# API Contract

> **Single Source of Truth**  
> Both backend and frontend follow this document. Before changing any request or response format, update this file first!

**Last updated by:** Template Init / Initial Setup  
**Base URL:** `http://localhost:8000/api` (or `http://<BACKEND_IP>:8000/api` when on separate machines)

---

## Endpoints

| Method | Endpoint | Request Body | Response (Success) | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | None | `{"status": "ok"}` | Health check endpoint |
| `GET` | `/api/items` | None | `[{"id": 1, "title": "Text", "done": false}, ...]` | Retrieve all items |
| `POST` | `/api/items` | `{"title": "New item"}` | `{"id": 4, "title": "New item", "done": false}` | Create a new item |
| `PUT` | `/api/items/{id}` | `{"done": true}` or `{"title": "Updated"}` | `{"id": 1, "title": "Updated", "done": true}` | Update an existing item |
| `DELETE` | `/api/items/{id}` | None | `{"status": "deleted", "id": 1}` | Delete an item by ID |

---

## Data Models

### Item
```json
{
  "id": 1,
  "title": "Set up project structure",
  "done": true
}
```

---

## Instructions for Adding New Endpoints
1. Add your proposed endpoint to the table above.
2. Specify expected status codes (e.g., 200, 201, 404).
3. Notify teammate / switch to backend to implement and frontend to consume.
