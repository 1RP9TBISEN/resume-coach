# Hackathon Demo Checklist

Go through this checklist 30 minutes before your presentation to guarantee a smooth, flawless demo.

---

## 1. System Readiness
- [ ] **Backend is running:** `curl http://localhost:8000/api/health` returns `{"status":"ok"}`.
- [ ] **Interactive docs work:** Check `http://localhost:8000/docs` in your browser.
- [ ] **Frontend is running:** Dev server is reachable on `http://localhost:5173`.
- [ ] **Seed data is loaded:** Refreshing the UI displays realistic, meaningful demo data.
- [ ] **No browser console errors:** Open DevTools (F12) -> Console tab; verify no unhandled red errors.
- [ ] **Mock fallback works:** Test stopping backend (`Ctrl+C`); frontend still gracefully shows mock data without crashing.
- [ ] **Two-laptop connectivity verified (if applicable):**
  - Backend host IP is accessible from Laptop B.
  - `frontend/.env` has `VITE_API_URL=http://<BACKEND_IP>:8000`.
  - Firewall port 8000 is open.

---

## 2. Documentation & Repo Cleanliness
- [ ] **README updated:** Project title, one-line elevator pitch, and problem solved are filled in.
- [ ] **No sensitive tokens or `.env` committed.**
- [ ] **Seed data reflects your hackathon concept:** (Replace generic todo items with your actual use case).

---

## 3. 2-Minute Demo Script Outline
Keep the presentation tight, engaging, and focused on the user problem.

- **0:00 - 0:30 (The Hook & The Problem):**
  - "Hello judges! Today, [target users] face [pain point], losing [hours/money/effort]."
  - State project name and your 1-sentence solution.
- **0:30 - 1:30 (Live Demo / Golden Path):**
  - Show the working UI with initial seed data.
  - Perform the primary user action live (e.g., submit an input, trigger the core algorithm / API, show the result).
  - Emphasize the unique feature that makes your project stand out.
- **1:30 - 2:00 (Impact & What's Next):**
  - Briefly highlight the tech stack (FastAPI + React).
  - Mention 1 future feature you'd build next.
  - Thank the judges and open for questions.

---

## 4. Public Link / Backup Options
If presenting from mobile or judges want to try it on their phones:
- **Local Wi-Fi:** Ensure laptops and phones are on the same Wi-Fi network and open `http://<IP>:5173`.
- **Tunnel (Optional Quick Backup):** Use Cloudflare Tunnel or ngrok if Wi-Fi network isolation is enabled:
  ```bash
  # Instant public URL without account setup (using cloudflared if installed):
  npx untun@latest tunnel http://localhost:5173
  # or
  npx localtunnel --port 5173
  ```
