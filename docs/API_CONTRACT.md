# API Contract

> **Single Source of Truth**  
> Both backend and frontend follow this document. Before changing any request or response format, update this file first!

**Last updated by:** Resume Coach AI  
**Base URL:** `http://localhost:8000` (or `http://<BACKEND_IP>:8000` when on separate machines)

---

## Endpoints

| Method | Endpoint | Request Body | Response (Success) | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | None | `{"ok": true, "providers": ["gemini","groq"]}` | Health check and active providers |
| `POST` | `/api/analyze` | Multipart Form: `resume` (PDF file, optional), `resume_text` (string, optional), `jd` (string, required, 100-8000 chars) | JSON (see Analyze Response) | Analyze resume against JD |
| `POST` | `/api/jobs/match` | Multipart Form: `resume` (PDF file, optional), `resume_text` (string, optional), `location` (string, optional, default "India") | JSON (see Match Response) | Find matching jobs |
| `POST` | `/api/interview/answer` | JSON: `jd` (str), `resume_text` (str), `question` (str), `targets_gap` (str), `answer` (str) | JSON (see Answer Response) | Score an interview answer |
| `POST` | `/api/interview/summary` | JSON: `jd` (str), `qa` (array of `{question, answer, score}`) | JSON (see Summary Response) | Overall interview summary |

---

## Data Models

### Analyze Response
```json
{
  "resume_text": "string",
  "match_score": 85,
  "verdict": "string",
  "breakdown": [
    {"label": "Skills", "score": 90},
    {"label": "Experience", "score": 80},
    {"label": "Keywords", "score": 85},
    {"label": "Impact", "score": 75}
  ],
  "skills": [
    {"name": "Python", "status": "matched", "importance": "high", "evidence": "Used Python in XYZ project"}
  ],
  "gaps": [
    {"gap": "AWS", "why_it_matters": "Required for deployment", "how_to_fix": "Learn AWS basics"}
  ],
  "rewrites": [
    {"original": "Did some coding", "improved": "Developed backend using Python", "reason": "Better action verb", "jd_keywords": ["Python"]}
  ],
  "questions": [
    {"id": 1, "question": "How did you use Python?", "type": "technical", "targets_gap": "AWS"}
  ]
}
```

### Match Response
```json
{
  "resume_text": "string",
  "roles": [
    {
      "title": "Backend Developer",
      "fit_score": 90,
      "why": "Strong Python skills match requirements.",
      "matched_skills": ["Python", "FastAPI"],
      "missing_skills": ["AWS"],
      "level": "junior",
      "sample_jd": "We need a Python developer...",
      "search_query": "Python Backend Developer"
    }
  ]
}
```

### Answer Response
```json
{
  "score": 8,
  "strengths": ["Good use of STAR method", "Specific examples"],
  "improvements": ["Need more AWS details"],
  "better_answer": "I developed XYZ using AWS..."
}
```

### Summary Response
```json
{
  "overall_score": 85,
  "readiness": "ready",
  "top_strengths": ["Technical skills", "Communication"],
  "focus_areas": ["AWS", "System Design"],
  "next_steps": ["Review AWS basics", "Practice system design questions"]
}
```
