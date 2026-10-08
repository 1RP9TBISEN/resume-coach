# Workflow: Connect Frontend

Use this workflow to wire up frontend components to real backend endpoints.

## Steps to Follow:
1. **Consult the API Contract:**
   - Review `docs/API_CONTRACT.md` to identify the expected endpoint path, method, and payload structure.

2. **Update the API Client:**
   - In `frontend/src/api.js`, add or update the helper function for the endpoint.
   - Ensure the request uses `BASE_URL` (`import.meta.env.VITE_API_URL || ""`).
   - Wrap the network call in `try...catch`. On error, log a `console.warn` and return fallback data from `frontend/src/mock.js`.

3. **Wire into React Component:**
   - In your component (e.g., `App.jsx`), call the API helper.
   - Maintain appropriate UI state:
     - `loading`: show a subtle loading spinner or indicator.
     - `error`: show user-friendly feedback without breaking the view.
     - `data`: display the received items or state.

4. **Verify in Browser:**
   - Confirm data loads from backend when backend is running.
   - Test stopping backend to verify graceful mock fallback.
   - Confirm no uncaught exceptions in browser console.
