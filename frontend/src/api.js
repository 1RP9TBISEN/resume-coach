import {
  getMockAnalyze,
  getMockJobs,
  getMockAnswer,
  getMockSummary,
} from "./mock";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

/**
 * Helper to process backend error responses and extract `detail`
 */
async function handleResponse(res) {
  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errorJson = await res.json();
      if (errorJson && errorJson.detail) {
        if (typeof errorJson.detail === "string") {
          errorDetail = errorJson.detail;
        } else if (Array.isArray(errorJson.detail)) {
          errorDetail = errorJson.detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
        } else {
          errorDetail = JSON.stringify(errorJson.detail);
        }
      }
    } catch {
      // Body not JSON
    }
    throw new Error(errorDetail);
  }
  return await res.json();
}

/**
 * POST /api/analyze (multipart: resume PDF or resume_text, jd)
 */
export async function analyze(formData) {
  if (USE_MOCK) {
    return await getMockAnalyze(formData);
  }
  try {
    const res = await fetch(`${BASE_URL}/api/analyze`, {
      method: "POST",
      body: formData,
    });
    return await handleResponse(res);
  } catch (err) {
    console.warn("[API] analyze failed:", err.message);
    throw err;
  }
}

/**
 * POST /api/jobs/match (multipart: resume or resume_text, location="India")
 */
export async function matchJobs(formData) {
  if (USE_MOCK) {
    return await getMockJobs(formData);
  }
  try {
    const res = await fetch(`${BASE_URL}/api/jobs/match`, {
      method: "POST",
      body: formData,
    });
    return await handleResponse(res);
  } catch (err) {
    console.warn("[API] matchJobs failed:", err.message);
    throw err;
  }
}

/**
 * POST /api/interview/answer (JSON {jd, resume_text, question, targets_gap, answer})
 */
export async function answerQuestion(body) {
  if (USE_MOCK) {
    return await getMockAnswer(body);
  }
  try {
    const res = await fetch(`${BASE_URL}/api/interview/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await handleResponse(res);
  } catch (err) {
    console.warn("[API] answerQuestion failed:", err.message);
    throw err;
  }
}

/**
 * POST /api/interview/summary (JSON {jd, qa:[{question, answer, score}]})
 */
export async function getSummary(body) {
  if (USE_MOCK) {
    return await getMockSummary(body);
  }
  try {
    const res = await fetch(`${BASE_URL}/api/interview/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await handleResponse(res);
  } catch (err) {
    console.warn("[API] getSummary failed:", err.message);
    throw err;
  }
}
