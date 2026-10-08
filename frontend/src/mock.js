import analyzeData from "./mock/analyze.json";
import jobsData from "./mock/jobs.json";
import answerData from "./mock/answer.json";
import summaryData from "./mock/summary.json";

/**
 * Returns mock analyze data after a simulated delay.
 */
export async function getMockAnalyze(formData) {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  // If specific resume text or JD was provided, we can return realistic data
  return JSON.parse(JSON.stringify(analyzeData));
}

/**
 * Returns mock jobs data after a simulated delay.
 */
export async function getMockJobs(formData) {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return JSON.parse(JSON.stringify(jobsData));
}

/**
 * Returns mock answer evaluation after a simulated delay.
 */
export async function getMockAnswer(body) {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const { question, answer = "", targets_gap = "" } = body || {};
  
  // Calculate a realistic score based on answer quality/length
  const trimmed = answer.trim();
  let score = 8;
  if (trimmed.length < 30) {
    score = 4;
  } else if (trimmed.length < 80) {
    score = 6;
  } else if (trimmed.length > 200) {
    score = 9;
  }

  const customStrengths = [
    "Directly addressed the core challenge in the prompt",
    "Highlighted relevant technologies and practical problem-solving logic",
    "Showed good engineering maturity and logical flow"
  ];

  const customImprovements = [
    "Add more specific metrics and quantifiable outcome benchmarks",
    `Address target gap '${targets_gap || "technical depth"}' with deeper implementation details`
  ];

  return {
    score,
    strengths: customStrengths,
    improvements: customImprovements,
    better_answer: answerData.better_answer || "In a production environment, structure your answer using STAR (Situation, Task, Action, Result) and quantify the business impact (e.g., latency, crash rates, or team velocity)."
  };
}

/**
 * Returns mock interview summary after a simulated delay.
 */
export async function getMockSummary(body) {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const { qa = [] } = body || {};

  let avgScore = 80;
  if (qa.length > 0) {
    const totalScore = qa.reduce((acc, curr) => acc + (Number(curr.score) || 7), 0);
    avgScore = Math.round((totalScore / (qa.length * 10)) * 100);
  }

  let readiness = "ready";
  if (avgScore < 50) {
    readiness = "not_yet";
  } else if (avgScore < 75) {
    readiness = "almost";
  }

  return {
    overall_score: avgScore,
    readiness,
    top_strengths: summaryData.top_strengths,
    focus_areas: summaryData.focus_areas,
    next_steps: summaryData.next_steps
  };
}

/**
 * Returns mock voice transcription after a 1s simulated delay.
 */
export async function getMockTranscribe(formData) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    transcript: "In my previous project, I implemented React Query for optimistic updates and configured custom Axios retry interceptors with exponential backoff to handle intermittent network failures."
  };
}
