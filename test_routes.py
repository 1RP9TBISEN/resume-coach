import os
from fastapi.testclient import TestClient
import sys

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
from backend.main import app

client = TestClient(app)

RESUME_TEXT = """Indra Krishna Patel — B.Tech Computer Science, AITR Indore (2023–2027). Skills: C++, DSA, JavaScript, React, HTML/CSS, Git, Python basics. Projects: EdgeTrack — React trading journal to log trades, tag strategies and review P&L; Crop disease detection app — image classification model to identify leaf diseases and suggest remedies. Hackathons: participated in MLH events."""

JD_TEXT = """Frontend Developer Intern — Bengaluru fintech startup. Build responsive UIs with React and TypeScript, integrate REST APIs, write unit tests with Jest, use Git and CI/CD, optimise web performance. Nice to have: Tailwind CSS, Next.js, charts and financial data visualisation."""

def run_tests():
    print("Testing ALL AI routes...")
    results = {}

    # Test 1: Jobs Match
    print("\n1. Testing /api/jobs/match...")
    try:
        resp = client.post("/api/jobs/match", data={"resume_text": RESUME_TEXT, "location": "India"})
        if resp.status_code == 200:
            data = resp.json()
            roles = data.get("roles", [])
            is_sorted = all(roles[i]["fit_score"] >= roles[i+1]["fit_score"] for i in range(len(roles)-1))
            valid_length = len(roles) == 5
            valid_jd = all(120 <= len(r.get("sample_jd", "").split()) <= 180 for r in roles)
            results["Jobs Match"] = "PASS" if valid_length and is_sorted and valid_jd else f"FAIL (len:{len(roles)}, sorted:{is_sorted}, jd_lengths:{[len(r.get('sample_jd', '').split()) for r in roles]})"
            print(f"Result: {results['Jobs Match']}")
            if not valid_length or not is_sorted or not valid_jd:
                print(f"Data: {roles}")
        else:
            results["Jobs Match"] = f"FAIL (HTTP {resp.status_code})"
    except Exception as e:
         results["Jobs Match"] = f"ERROR ({e})"

    # Test 2: Analyze
    print("\n2. Testing /api/analyze...")
    try:
        resp = client.post("/api/analyze", data={"resume_text": RESUME_TEXT, "jd": JD_TEXT})
        if resp.status_code == 200:
            data = resp.json()
            q_len = len(data.get("questions", []))
            has_keywords = False
            raw_str = str(data).lower()
            if any(k in raw_str for k in ['typescript', 'rest api', 'jest', 'ci/cd']):
                has_keywords = True
            
            valid_rewrite = True
            for r in data.get("rewrites", []):
                if r.get("original") not in RESUME_TEXT:
                    valid_rewrite = False
            
            results["Analyze"] = "PASS" if q_len == 5 and has_keywords and valid_rewrite else f"FAIL (q_len:{q_len}, kw:{has_keywords}, rewrite_orig:{valid_rewrite})"
            print(f"Result: {results['Analyze']}")
        else:
            results["Analyze"] = f"FAIL (HTTP {resp.status_code})"
    except Exception as e:
         results["Analyze"] = f"ERROR ({e})"

    # Test 3: Interview Answer (Weak)
    print("\n3. Testing /api/interview/answer (Weak)...")
    try:
        resp = client.post("/api/interview/answer", json={
            "jd": JD_TEXT, "resume_text": RESUME_TEXT, "question": "How do you test your frontend code?", "targets_gap": "Jest", "answer": "I would just use React"
        })
        if resp.status_code == 200:
            data = resp.json()
            score_weak = data.get("score", 10)
            results["Interview (Weak)"] = "PASS" if score_weak <= 5 else f"FAIL (score: {score_weak})"
            print(f"Result: {results['Interview (Weak)']}")
        else:
            results["Interview (Weak)"] = f"FAIL (HTTP {resp.status_code})"
    except Exception as e:
         results["Interview (Weak)"] = f"ERROR ({e})"
         
    # Test 4: Interview Answer (Decent)
    print("\n4. Testing /api/interview/answer (Decent)...")
    try:
        resp = client.post("/api/interview/answer", json={
            "jd": JD_TEXT, "resume_text": RESUME_TEXT, "question": "How do you test your frontend code?", "targets_gap": "Jest", "answer": "I usually manually test my components, but I'm learning Jest to write automated unit tests for my React components. I know how to mock functions and check snapshots."
        })
        if resp.status_code == 200:
            data = resp.json()
            score_decent = data.get("score", 0)
            # score_decent should be > score_weak, but we just check if it's decent.
            results["Interview (Decent)"] = "PASS" if score_decent > 4 else f"FAIL (score: {score_decent})"
            print(f"Result: {results['Interview (Decent)']}")
        else:
            results["Interview (Decent)"] = f"FAIL (HTTP {resp.status_code})"
    except Exception as e:
         results["Interview (Decent)"] = f"ERROR ({e})"

    # Test 5: Interview Summary
    print("\n5. Testing /api/interview/summary...")
    try:
        resp = client.post("/api/interview/summary", json={
            "jd": JD_TEXT,
            "qa": [
                {"question": "Q1", "answer": "A1", "score": 8},
                {"question": "Q2", "answer": "A2", "score": 7},
                {"question": "Q3", "answer": "A3", "score": 9},
                {"question": "Q4", "answer": "A4", "score": 6},
                {"question": "Q5", "answer": "A5", "score": 8}
            ]
        })
        if resp.status_code == 200:
            data = resp.json()
            score = data.get("overall_score", 0)
            readiness = data.get("readiness")
            expected_r = "ready" if score >= 75 else "almost" if score >= 50 else "not_yet"
            results["Interview Summary"] = "PASS" if expected_r == readiness else f"FAIL (score:{score}, readiness:{readiness})"
            print(f"Result: {results['Interview Summary']}")
        else:
            results["Interview Summary"] = f"FAIL (HTTP {resp.status_code})"
    except Exception as e:
         results["Interview Summary"] = f"ERROR ({e})"

    # Test 6: Analyze with PDF
    print("\n6. Testing /api/analyze with PDF...")
    try:
        pdf_path = "backend/samples/sample_resume.pdf"
        with open(pdf_path, "rb") as f:
            resp = client.post("/api/analyze", data={"jd": JD_TEXT}, files={"resume": ("sample_resume.pdf", f, "application/pdf")})
            
        if resp.status_code == 200:
            data = resp.json()
            results["Analyze PDF"] = "PASS" if data.get("resume_text") else "FAIL (no text extracted)"
            print(f"Result: {results['Analyze PDF']}")
        else:
            results["Analyze PDF"] = f"FAIL (HTTP {resp.status_code})"
    except Exception as e:
         results["Analyze PDF"] = f"ERROR ({e})"

    print("\n\n" + "="*40)
    print("TEST SUMMARY")
    print("="*40)
    for k, v in results.items():
        print(f"{k.ljust(25)} | {v}")
    print("="*40)

if __name__ == "__main__":
    run_tests()
