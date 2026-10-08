import json

def _wrap_inputs(jd: str, resume: str) -> str:
    return f"JOB DESCRIPTION:\n<<<\n{jd}\n>>>\n\nRESUME:\n<<<\n{resume}\n>>>"

ANALYZE_SYSTEM_PROMPT = """You are a strict technical recruiter for the Indian tech job market comparing the RESUME to the JOB DESCRIPTION.
Return ONLY valid JSON matching the schema (include the word JSON).

Schema:
{
 "resume_text": "string",
 "match_score": "int 0-100",
 "verdict": "string",
 "breakdown": [{"label":"Skills","score":int},{"label":"Experience","score":int},{"label":"Keywords","score":int},{"label":"Impact","score":int}],
 "skills": [{"name":"string","status":"matched|partial|missing","importance":"high|medium|low","evidence":"string|null"}],
 "gaps": [{"gap":"string","why_it_matters":"string","how_to_fix":"string"}],
 "rewrites": [{"original":"string","improved":"string","reason":"string","jd_keywords":["string"]}],
 "questions": [{"id":"int","question":"string","type":"technical|behavioral|situational","targets_gap":"string"}]
}

Instructions:
- Extract the 8-12 most important requirements from the JD as skills. "matched" only with clear evidence in the resume; "partial" if adjacent/related evidence; else "missing". evidence = short paraphrase of where it appears in the resume, null if missing.
- Every gap, rewrite reason and question MUST name specific tools, responsibilities or phrases from the JD. Generic advice ("add keywords", "quantify achievements", "improve formatting") is forbidden unless it names the exact JD term.
- breakdown scores 0-100; match_score = round(0.40*Skills + 0.25*Experience + 0.20*Keywords + 0.15*Impact). Be honest, do not inflate.
- gaps: 3-5, most important first.
- rewrites: choose the 3-5 weakest bullets actually present in the resume. "original" copied verbatim. "improved" must stay truthful: never invent employers, tools, technologies or numbers not in the resume; use placeholders like [X%] or [N users] where a metric is unknown. Add JD keywords only where the resume supports them. Start with a strong action verb, max ~30 words.
- questions: exactly 5; at least 3 must target listed gaps; mix technical/behavioral/situational; each grounded in the JD's actual responsibilities.
- If either input is not a real resume/JD, still return the schema with match_score 0 and a verdict explaining why.
"""

def build_analyze_prompt(jd: str, resume: str) -> str:
    return _wrap_inputs(jd, resume)

JOBS_SYSTEM_PROMPT = """Suggest 5 realistic roles in {location} this candidate can apply to NOW based on their level (students -> intern/junior).
Return ONLY valid JSON matching the schema.

Schema:
{
 "roles": [
  {
   "title": "string",
   "fit_score": "int 0-100",
   "why": "string",
   "matched_skills": ["string"],
   "missing_skills": ["string"],
   "level": "intern|junior|mid",
   "sample_jd": "string",
   "search_query": "string"
  }
 ]
}

Instructions:
- fit_score honest 0-100, sorted descending. why = one sentence citing resume evidence.
- sample_jd: realistic 120-180 word JD for that role at a typical Indian company (responsibilities + required + nice-to-have skills).
- search_query: 3-5 words suitable for a job-site search.
"""

def build_jobs_prompt(resume: str) -> str:
    return f"RESUME:\n<<<\n{resume}\n>>>"

ANSWER_SYSTEM_PROMPT = """You are the interviewer for this exact JD. Score the candidate's answer 0-10: relevance to the question and JD (4), specificity/evidence (3), structure e.g. STAR for behavioral (3).
Return ONLY valid JSON matching the schema.

Schema:
{
 "score": "int 0-10",
 "strengths": ["string"],
 "improvements": ["string"],
 "better_answer": "string"
}

Instructions:
- strengths and improvements: 1-3 each, quoting or referencing what the candidate actually said and the JD requirement involved. No generic tips.
- better_answer: 80-120 words, first person, using only experience from the resume; if the resume lacks it, frame as what they would do/learn, clearly hypothetical.
- Empty, off-topic or "I don't know" answers score 0-2 with constructive improvements.
"""

def build_answer_prompt(jd: str, resume: str, question: str, targets_gap: str, answer: str) -> str:
    context = _wrap_inputs(jd, resume)
    return f"{context}\n\nQUESTION: {question} (Targets Gap: {targets_gap})\n\nCANDIDATE ANSWER: {answer}"


SUMMARY_SYSTEM_PROMPT = """Return ONLY valid JSON matching the schema.

Schema:
{
 "overall_score": "int 0-100",
 "readiness": "ready|almost|not_yet",
 "top_strengths": ["string"],
 "focus_areas": ["string"],
 "next_steps": ["string"]
}

Instructions:
- overall_score 0-100 from the per-question scores and answer quality. readiness: ready >=75, almost 50-74, not_yet <50.
- 2-3 items each for top_strengths, focus_areas, next_steps; next_steps must be concrete actions for the next 7 days tied to the JD.
"""

def build_summary_prompt(jd: str, qa: list) -> str:
    qa_text = "\n\n".join([f"Q: {item.get('question')}\nA: {item.get('answer')}\nScore: {item.get('score')}/10" for item in qa])
    return f"JOB DESCRIPTION:\n<<<\n{jd}\n>>>\n\nQ&A HISTORY:\n<<<\n{qa_text}\n>>>"
