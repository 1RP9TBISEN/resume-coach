# Workflow: Add Endpoint

Use this workflow whenever you need to add a new backend endpoint to the application.

## Steps to Follow:
1. **Define the Contract First:**
   - Open `docs/API_CONTRACT.md`.
   - Add the new endpoint to the table (Method, Path, Request Body, Response shape).
   - Update the "Last updated by" header.

2. **Implement in Backend:**
   - In `backend/db.py`: add any necessary database table schema or query functions. Ensure relevant demo seed data is added.
   - In `backend/main.py`: implement the route under `/api/...` matching the contract exactly.
   - Keep CORS enabled and request/response models clear.

3. **Verify with curl:**
   - Run a test `curl` request against the running backend:
     ```bash
     curl -X GET http://localhost:8000/api/<endpoint>
     # or for POST:
     curl -X POST http://localhost:8000/api/<endpoint> -H "Content-Type: application/json" -d '{"key": "value"}'
     ```
   - Confirm status code and response payload match `docs/API_CONTRACT.md`.
4. **Summary:**
   - Provide a 1-3 line summary of the endpoint added and the curl verification result.
