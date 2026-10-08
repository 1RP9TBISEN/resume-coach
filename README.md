# hackathon-starter

> A blazingly fast FastAPI + React starter template optimized for 2-3 hour hackathon builds.

## Prerequisites
- **Python 3.10+**
- **Node 18+**
- **Git**

---

## 🚀 First-Time Setup
Clone the repository, then run the setup script from the root folder:
```bash
npm run setup
```
*(This creates the Python virtual environment, installs backend dependencies, and installs all frontend npm packages.)*

---

## 💻 Run on One Laptop (Solo Developer)
To run both the backend and frontend simultaneously, use:
```bash
npm run dev
```
- **Frontend:** http://localhost:5173
- **Backend API Docs:** http://localhost:8000/docs

---

## 🤝 Run Across Two Laptops (Pair Programming)

When dividing work across two laptops (e.g., Laptop A runs backend, Laptop B runs frontend):

**Laptop A (Backend):**
1. Ensure you are on the same local network (Wi-Fi).
2. Start the backend:
   ```bash
   npm run backend
   ```
   *(This starts uvicorn with `--host 0.0.0.0`, making it accessible on the network).*
3. Find Laptop A's IP address:
   - Mac: `ipconfig getifaddr en0`
   - Linux: `ip a` (look for the `inet` address under wlan0/en0)
4. (Optional) If Laptop B cannot connect, ensure Laptop A's firewall allows port `8000`.

**Laptop B (Frontend):**
1. Copy `frontend/.env.example` to `frontend/.env`.
2. Update the `VITE_API_URL` to point to Laptop A's IP address:
   ```env
   VITE_API_URL=http://<LAPTOP_A_IP>:8000
   ```
3. Start the frontend:
   ```bash
   npm run frontend
   ```
   *(The frontend will automatically route API requests to the provided `VITE_API_URL`).*

---

## 🌿 Git Routine
To avoid conflicts, commit small chunks frequently:
```bash
git pull origin main
git add .
git commit -m "Brief description of changes"
git push origin main
```

---

## 🔧 Troubleshooting

- **"Command not found: uvicorn" / "No module named fastapi"**:
  You didn't activate the virtual environment or run setup. Run `npm run setup` or ensure you run the backend using `npm run backend` (which uses the local venv path).
- **Frontend says "Mock Data" / Changes aren't saving**:
  The backend is down, or `VITE_API_URL` is incorrect. The frontend gracefully falls back to mock data when the backend is unreachable.
- **Port 8000 / 5173 is already in use**:
  Kill existing processes. Find them via `lsof -i :8000` (Mac/Linux) and kill the PID.
- **CORS Error on Laptop B**:
  Ensure the backend `main.py` still has `allow_origins=["*"]` configured in the `CORSMiddleware`.
- **Connection Refused (across laptops)**:
  Check that Laptop A's firewall allows incoming connections on port 8000, and double-check you have the correct local IP.
