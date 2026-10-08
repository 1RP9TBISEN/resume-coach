# Project Instructions for AI Agents & Developers

## Core Goal & Mindset
- **Target:** Ship a working demo in 2-3 hours.
- **Philosophy:** Simple beats perfect. Avoid premature optimization, over-engineering, or adding libraries unless strictly needed.
- If it works reliably for the demo, it is good enough.

## Tech Stack
- **Backend:** Python FastAPI + SQLite (`sqlite3` built-in), running on port 8000, host `0.0.0.0`.
- **Frontend:** React + Vite (Plain JavaScript, no TypeScript), running on port 5173 (`host: true`).
- **Orchestration:** Root `package.json` + `concurrently` to run both services simultaneously.

## Collaboration Rules
1. **API Contract is Law:** `docs/API_CONTRACT.md` is the single source of truth for all data shapes and endpoints. Never change an endpoint name or response structure without updating the contract first.
2. **Strict Folder Boundaries:** When working on two laptops, each developer/agent should only modify files in their assigned folder (`backend/` or `frontend/`).
3. **Decoupled Development:**
   - Frontend starts immediately with mock data from `src/mock.js` if backend endpoints are not ready.
   - Backend tests endpoints directly via `curl` or interactive docs at `http://localhost:8000/docs`.
4. **Always Verify:** Run and test your changes before declaring a task finished. Summarize changes in 1–3 concise lines.
5. **Security & Connectivity:**
   - Never commit `.env` or secrets to git.
   - Always keep CORS enabled for all origins on the backend to allow cross-laptop demos.
6. **Git Workflow:** Work directly on `main`. Keep commits small and descriptive. Always `git pull` before `git push`.
