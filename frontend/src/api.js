import {
  getMockAnalyze,
  getMockJobs,
  getMockAnswer,
  getMockSummary,
} from "./mock";

const RAW_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
// Strip any trailing slashes
export const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

/**
 * Fetch wrapper with AbortController 90s timeout
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 90000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } catch (err) {
    if (err.name === "AbortError") {
      const abortErr = new Error("Request timed out after 90s. The AI server may be waking up or overloaded.");
      abortErr.status = 408;
      throw abortErr;
    }
    if (err.name === "TypeError" && /fetch|network/i.test(err.message)) {
      const netErr = new Error("Can't reach the server. Please check your network or server URL.");
      netErr.status = 0;
      throw netErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Map status codes and extract backend details
 */
async function handleResponse(res) {
  if (!res.ok) {
    let backendDetail = "";
    try {
      const errorJson = await res.json();
      if (errorJson) {
        if (typeof errorJson.detail === "string") {
          backendDetail = errorJson.detail;
        } else if (Array.isArray(errorJson.detail)) {
          backendDetail = errorJson.detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
        } else if (errorJson.message) {
          backendDetail = errorJson.message;
        }
      }
    } catch {
      // Body is not JSON
    }

    // 413: "PDF is too large (max 5MB)"
    if (res.status === 413) {
      const err = new Error(backendDetail || "PDF is too large (max 5MB)");
      err.status = 413;
      throw err;
    }

    // 422: show backend detail (e.g. scanned PDF -> suggest pasting text)
    if (res.status === 422) {
      const message = backendDetail || "Could not parse PDF content. Please paste resume text instead.";
      const err = new Error(message);
      err.status = 422;
      err.isPdfParseError = /scanned|pdf|parse|extract|empty|unreadable/i.test(message);
      throw err;
    }

    // 429: "Too many requests, wait a minute"
    if (res.status === 429) {
      const err = new Error(backendDetail || "Too many requests, wait a minute");
      err.status = 429;
      throw err;
    }

    // 502/503/504: "AI is busy, retry in a few seconds"
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      const err = new Error(backendDetail || "AI is busy, retry in a few seconds");
      err.status = res.status;
      throw err;
    }

    const defaultMsg = backendDetail || `HTTP ${res.status}: ${res.statusText}`;
    const err = new Error(defaultMsg);
    err.status = res.status;
    throw err;
  }
  return await res.json();
}

/**
 * Wake-up ping on application load (free tier Render server sleep handling)
 */
export function pingHealth() {
  if (USE_MOCK) return;
  fetch(`${BASE_URL}/api/health`, { method: "GET", mode: "cors" }).catch(() => {
    // Non-blocking, ignore errors
  });
}

/**
 * POST /api/analyze (multipart: resume PDF or resume_text, jd)
 */
export async function analyze(formData) {
  if (USE_MOCK) {
    return await getMockAnalyze(formData);
  }
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/analyze`, {
      method: "POST",
      body: formData,
    });
    return await handleResponse(res);
  } catch (err) {
    console.warn("[API] analyze error:", err.message);
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
    const res = await fetchWithTimeout(`${BASE_URL}/api/jobs/match`, {
      method: "POST",
      body: formData,
    });
    return await handleResponse(res);
  } catch (err) {
    console.warn("[API] matchJobs error:", err.message);
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
    const res = await fetchWithTimeout(`${BASE_URL}/api/interview/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await handleResponse(res);
  } catch (err) {
    console.warn("[API] answerQuestion error:", err.message);
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
    const res = await fetchWithTimeout(`${BASE_URL}/api/interview/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await handleResponse(res);
  } catch (err) {
    console.warn("[API] getSummary error:", err.message);
    throw err;
  }
}
