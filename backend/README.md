# Backend - Resume & Interview Coach

This is a stateless FastAPI backend using Gemini and Groq as LLM providers for parsing and analyzing resumes against job descriptions.

## Prerequisites
- Python 3.9+
- Gemini API Key and/or Groq API Key

## Setup
1. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate
   # (On Windows: venv\Scripts\activate)
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
4. Add your `GEMINI_API_KEY` and/or `GROQ_API_KEY` to the `.env` file.

## Running the Server
Run the FastAPI application locally on port 8000:
```bash
uvicorn main:app --reload --port 8000
```
Then navigate to `http://localhost:8000/docs` to view the interactive API documentation and test endpoints.

## Environment Variables
- `GEMINI_API_KEY` - Your Google Gemini API key.
- `GROQ_API_KEY` - Your Groq API key (used as fallback).
- `GEMINI_MODEL` - Default: `gemini-2.5-flash`.
- `GROQ_MODEL` - Default: `llama-3.3-70b-versatile`.
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins (default: `http://localhost:5173`).
- `ALLOWED_ORIGIN_REGEX` - Regex for allowed origins (default: `https://.*\.vercel\.app`).

## Deployment (Render)
To deploy this backend on Render (Web Service), configure the following Start Command:
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```
Make sure to add the Environment Variables in the Render dashboard.
