# API Contract

> **Single Source of Truth**  
> Both backend and frontend follow this document. Before changing any request or response format, update this file first!

**Last updated by:** Frontend Setup (ResumeCoach)  
**Base URL:** `http://localhost:8000` (or `http://<BACKEND_IP>:8000` when on separate machines)

---

## Endpoints

| Method | Endpoint | Request Body | Response (Success) | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/analyze` | Multipart Form: `resume` (PDF file) or `resume_text` (string), `jd` (string) | AnalyzeResponse JSON | Analyzes resume against JD, returns score, skills breakdown, gaps, rewrites, and mock questions |
| `POST` | `/api/jobs/match` | Multipart Form: `resume` (PDF file) or `resume_text` (string), `location` (string, default "India") | JobMatchResponse JSON | Matches resume with top tech roles in India, returns fit score, matched/missing skills, sample JD |
| `POST` | `/api/interview/answer` | JSON: `{jd, resume_text, question, targets_gap, answer}` | AnswerFeedback JSON | Evaluates interview answer, returns score (0-10), strengths, improvements, and stronger answer |
| `POST` | `/api/interview/summary` | JSON: `{jd, qa: [{question, answer, score}]}` | InterviewSummary JSON | Generates final interview scorecard with overall score, readiness, strengths, focus areas, next steps |
| `POST` | `/api/transcribe` | Multipart Form: `audio` (audio file blob e.g. webm/mp4) | `{"transcript": "string"}` | Transcribes spoken audio answer to text for voice interview |

---

## Data Models

### 1. AnalyzeResponse (`POST /api/analyze`)
```json
{
  "resume_text": "string",
  "match_score": 82,
  "verdict": "string",
  "breakdown": [
    { "label": "Skills", "score": 88 },
    { "label": "Experience", "score": 78 },
    { "label": "Keywords", "score": 85 },
    { "label": "Impact", "score": 77 }
  ],
  "skills": [
    {
      "name": "React.js",
      "status": "matched",
      "importance": "high",
      "evidence": "Built multiple production web apps with React 18"
    }
  ],
  "gaps": [
    {
      "gap": "Enterprise TypeScript Experience",
      "why_it_matters": "string",
      "how_to_fix": "string"
    }
  ],
  "rewrites": [
    {
      "original": "string",
      "improved": "string",
      "reason": "string",
      "jd_keywords": ["React.js", "REST APIs"]
    }
  ],
  "questions": [
    {
      "id": 1,
      "question": "string",
      "type": "technical",
      "targets_gap": "string"
    }
  ]
}
```

### 2. JobMatchResponse (`POST /api/jobs/match`)
```json
{
  "resume_text": "string",
  "roles": [
    {
      "title": "Frontend Developer Intern",
      "fit_score": 92,
      "why": "string",
      "matched_skills": ["React.js", "JavaScript", "HTML5 & CSS3"],
      "missing_skills": ["Next.js", "Jest / RTL"],
      "level": "intern",
      "sample_jd": "string",
      "search_query": "Frontend Developer Intern"
    }
  ]
}
```

### 3. AnswerFeedback (`POST /api/interview/answer`)
```json
{
  "score": 8,
  "strengths": [
    "Used the STAR structure effectively",
    "Highlighted practical error recovery"
  ],
  "improvements": [
    "Include specific metrics like latency reduction"
  ],
  "better_answer": "string"
}
```

### 4. InterviewSummary (`POST /api/interview/summary`)
```json
{
  "overall_score": 84,
  "readiness": "ready",
  "top_strengths": [
    "Articulates complex React concepts with clarity"
  ],
  "focus_areas": [
    "Consistently back up decisions with quantitative metrics"
  ],
  "next_steps": [
    "Add unit tests to your top project"
  ]
}
```
