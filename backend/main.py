import os
import io
import time
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from pypdf import PdfReader

load_dotenv()

from llm import generate_json, LLMError
from prompts import (
    ANALYZE_SYSTEM_PROMPT, build_analyze_prompt,
    JOBS_SYSTEM_PROMPT, build_jobs_prompt,
    ANSWER_SYSTEM_PROMPT, build_answer_prompt,
    SUMMARY_SYSTEM_PROMPT, build_summary_prompt
)

app = FastAPI()

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
allowed_origin_regex = os.getenv("ALLOWED_ORIGIN_REGEX", r"https://.*\.vercel\.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allowed_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RATE_LIMIT = 20
RATE_WINDOW = 60
rate_limits: Dict[str, List[float]] = {}

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.method == "POST":
        ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown").split(",")[0].strip()
        now = time.time()
        
        if ip not in rate_limits:
            rate_limits[ip] = []
        
        rate_limits[ip] = [t for t in rate_limits[ip] if now - t < RATE_WINDOW]
        
        if len(rate_limits[ip]) >= RATE_LIMIT:
            return Response(content='{"detail":"Rate limit exceeded. Try again later."}', status_code=429, media_type="application/json")
            
        rate_limits[ip].append(now)
        
    return await call_next(request)

class QAItem(BaseModel):
    question: str
    answer: str
    score: int

class AnswerRequest(BaseModel):
    jd: str = Field(..., max_length=8000)
    resume_text: str = Field(..., max_length=15000)
    question: str
    targets_gap: str
    answer: str = Field(..., max_length=4000)

class SummaryRequest(BaseModel):
    jd: str = Field(..., max_length=8000)
    qa: List[QAItem]

def extract_resume_text(resume_file: Optional[UploadFile], resume_text: Optional[str]) -> str:
    if resume_text:
        return resume_text[:15000]
    if resume_file:
        content = resume_file.file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(413, "PDF size exceeds 5MB")
        if not content.startswith(b"%PDF"):
            raise HTTPException(400, "File is not a valid PDF")
        
        try:
            reader = PdfReader(io.BytesIO(content))
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
        except Exception:
            raise HTTPException(422, "Couldn't read text from this PDF (maybe scanned). Paste your resume text instead.")
            
        if len(text.strip()) < 100:
            raise HTTPException(422, "Couldn't read text from this PDF (maybe scanned). Paste your resume text instead.")
            
        return text[:15000]
    return ""

@app.get("/api/health")
def health():
    providers = []
    if os.getenv("GEMINI_API_KEY"):
        providers.append("gemini")
    if os.getenv("GROQ_API_KEY"):
        providers.append("groq")
    return {"ok": True, "providers": providers}

@app.post("/api/analyze")
def analyze(
    resume: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    jd: str = Form(..., max_length=8000)
):
    try:
        extracted_text = extract_resume_text(resume, resume_text)
    except HTTPException as e:
        raise e
        
    if not extracted_text:
        raise HTTPException(400, "Must provide either resume or resume_text")

    try:
        user_prompt = build_analyze_prompt(jd, extracted_text)
        result = generate_json(ANALYZE_SYSTEM_PROMPT, user_prompt)
        
        # Normalize
        result["match_score"] = max(0, min(100, result.get("match_score", 0)))
        result["gaps"] = result.get("gaps", [])
        result["rewrites"] = result.get("rewrites", [])
        result["skills"] = result.get("skills", [])
        result["breakdown"] = result.get("breakdown", [])
        
        for sk in result["skills"]:
            if sk.get("status") not in ["matched", "partial", "missing"]:
                sk["status"] = "missing"
            if sk.get("importance") not in ["high", "medium", "low"]:
                sk["importance"] = "medium"
                
        questions = result.get("questions", [])
        if len(questions) > 5:
            questions = questions[:5]
        for i, q in enumerate(questions):
            q["id"] = i + 1
            if q.get("type") not in ["technical", "behavioral", "situational"]:
                q["type"] = "technical"
        result["questions"] = questions
        
        result["resume_text"] = extracted_text
        return result
    except LLMError as e:
        raise HTTPException(502, "AI is busy right now, please retry in a few seconds.")

@app.post("/api/jobs/match")
def match_jobs(
    resume: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    location: str = Form("India")
):
    try:
        extracted_text = extract_resume_text(resume, resume_text)
    except HTTPException as e:
        raise e
        
    if not extracted_text:
        raise HTTPException(400, "Must provide either resume or resume_text")
        
    try:
        system_prompt = JOBS_SYSTEM_PROMPT.replace("{location}", location)
        user_prompt = build_jobs_prompt(extracted_text)
        result = generate_json(system_prompt, user_prompt)
        
        roles = result.get("roles", [])
        for r in roles:
            r["fit_score"] = max(0, min(100, r.get("fit_score", 0)))
            r["matched_skills"] = r.get("matched_skills", [])
            r["missing_skills"] = r.get("missing_skills", [])
            if r.get("level") not in ["intern", "junior", "mid"]:
                r["level"] = "junior"
                
        return {"resume_text": extracted_text, "roles": roles}
    except LLMError:
        raise HTTPException(502, "AI is busy right now, please retry in a few seconds.")

@app.post("/api/interview/answer")
def interview_answer(req: AnswerRequest):
    try:
        user_prompt = build_answer_prompt(req.jd, req.resume_text, req.question, req.targets_gap, req.answer)
        result = generate_json(ANSWER_SYSTEM_PROMPT, user_prompt)
        
        result["score"] = max(0, min(10, result.get("score", 0)))
        result["strengths"] = result.get("strengths", [])
        result["improvements"] = result.get("improvements", [])
        
        return result
    except LLMError:
        raise HTTPException(502, "AI is busy right now, please retry in a few seconds.")

@app.post("/api/interview/summary")
def interview_summary(req: SummaryRequest):
    if not 1 <= len(req.qa) <= 10:
        raise HTTPException(400, "qa must contain between 1 and 10 items")
        
    try:
        user_prompt = build_summary_prompt(req.jd, [{"question": q.question, "answer": q.answer, "score": q.score} for q in req.qa])
        result = generate_json(SUMMARY_SYSTEM_PROMPT, user_prompt)
        
        result["overall_score"] = max(0, min(100, result.get("overall_score", 0)))
        if result.get("readiness") not in ["ready", "almost", "not_yet"]:
            result["readiness"] = "not_yet"
        result["top_strengths"] = result.get("top_strengths", [])
        result["focus_areas"] = result.get("focus_areas", [])
        result["next_steps"] = result.get("next_steps", [])
        
        return result
    except LLMError:
        raise HTTPException(502, "AI is busy right now, please retry in a few seconds.")
