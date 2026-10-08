# Backend Agent Instructions

## Scope & Boundaries
- You are working exclusively inside the `backend/` directory and referencing `docs/API_CONTRACT.md`.
- Do not modify files in `frontend/`.

## Key Rules
1. **API Contract First:**
   - Every endpoint, request body, and response shape must match `docs/API_CONTRACT.md`.
   - If an endpoint needs changing, update `docs/API_CONTRACT.md` before changing backend code.
2. **Keep It Simple:**
   - Use built-in SQLite (`sqlite3`) in `db.py`.
   - Do not introduce heavy ORMs (no SQLAlchemy, no Alembic) unless explicitly requested.
   - All routes belong under `/api`.
   - Always preserve CORS middleware on the FastAPI app.
3. **Seed Data:**
   - Keep seed data in `db.py` meaningful, realistic, and tailored to the hackathon demo.
4. **Verification:**
   - After creating or modifying any route, run `curl` against the local server to verify status code and JSON output.
   - Example tests:
     - `curl -s http://localhost:8000/api/health`
     - `curl -s http://localhost:8000/api/items`
     - `curl -s -X POST http://localhost:8000/api/items -H "Content-Type: application/json" -d '{"title": "Test"}'`
5. **Report Clearly:**
   - Summarize code changes and verification output in 1-3 concise lines.
