# Workflow: Demo Preparation

Use this workflow in the final hour before hackathon presentations.

## Steps to Follow:
1. **Update Documentation:**
   - In `README.md`, ensure the project title, description, and key features reflect the actual hackathon project.

2. **Check Seed & Demo Data:**
   - Verify `backend/db.py` contains realistic, compelling seed data tailored to the presentation scenario.
   - Restart the backend to confirm clean initialization:
     ```bash
     curl -s http://localhost:8000/api/items
     ```

3. **Check for Errors:**
   - Open browser developer tools on `http://localhost:5173`. Check Console for red errors or warnings.
   - Inspect the terminal running the backend for uncaught exceptions or tracebacks.

4. **Run Through Demo Checklist:**
   - Open `docs/DEMO_CHECKLIST.md` and verify each item.
   - Dry run the 2-minute pitch along the outline in the checklist.

5. **Identify and Fix Any Blockers:**
   - List anything broken or unpolished.
   - Fix high-severity issues immediately; hide or stub incomplete secondary features.
