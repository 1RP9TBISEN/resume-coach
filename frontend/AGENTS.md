# Frontend Agent Instructions

## Scope & Boundaries
- You are working exclusively inside the `frontend/` directory.
- Refer to `docs/API_CONTRACT.md` as the ultimate source of truth for all data shapes and API endpoints.

## Key Rules
1. **API Abstraction:**
   - Always route external backend calls through `src/api.js`.
   - Never use `fetch` or `axios` directly inside a React component (e.g., `App.jsx`).
2. **Resilience & Fallback:**
   - Every function in `src/api.js` must implement a `try...catch` block.
   - On network failure, it should gracefully fall back to mock data from `src/mock.js` and log a warning to the console.
3. **Keep UI Simple & Clean:**
   - Use simple CSS classes (defined in `App.css`).
   - Do not install heavyweight component libraries (e.g., Material UI, Ant Design) unless strictly required for a complex hackathon feature.
   - Ensure you handle **loading**, **empty**, and **error** states cleanly.
4. **Verification:**
   - After writing UI logic, always ensure the dev server (`npm run dev`) successfully compiles.
   - Ensure the UI renders properly on both desktop and mobile viewports.
5. **Report Clearly:**
   - Summarize code changes and visual UI updates in 1-3 concise lines.
