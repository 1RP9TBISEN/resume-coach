import React, { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import ErrorBanner from "./components/ErrorBanner";
import { ResultsSkeleton, JobsSkeleton } from "./components/LoadingSkeleton";
import InputScreen from "./screens/InputScreen";
import JobsScreen from "./screens/JobsScreen";
import ResultsScreen from "./screens/ResultsScreen";
import InterviewScreen from "./screens/InterviewScreen";
import ScorecardScreen from "./screens/ScorecardScreen";
import { analyze, matchJobs, answerQuestion, getSummary } from "./api";
import "./App.css";

export default function App() {
  // Theme state
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("resumecoach_theme");
    if (saved) return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("resumecoach_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // View state machine: 'input' | 'jobs' | 'results' | 'interview' | 'scorecard'
  const [currentView, setCurrentView] = useState("input");
  const [previousView, setPreviousView] = useState("input");

  // Core App State
  const [resumeMode, setResumeMode] = useState("file"); // 'file' | 'text'
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");

  // API Responses
  const [analysis, setAnalysis] = useState(null);
  const [roles, setRoles] = useState([]);
  const [qa, setQa] = useState([]);
  const [summary, setSummary] = useState(null);

  // Interview sub-state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentFeedback, setCurrentFeedback] = useState(null);

  // Loading & Error states
  const [loadingAction, setLoadingAction] = useState(null); // 'analyze' | 'jobs' | 'answer' | 'summary' | null
  const [errorMessage, setErrorMessage] = useState("");
  const [retryAction, setRetryAction] = useState(null);

  // Helper to build FormData
  const createResumeFormData = useCallback((extraFields = {}) => {
    const formData = new FormData();
    if (resumeMode === "file" && resumeFile) {
      formData.append("resume", resumeFile);
    } else {
      formData.append("resume_text", resumeText);
    }
    Object.entries(extraFields).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        formData.append(k, v);
      }
    });
    return formData;
  }, [resumeMode, resumeFile, resumeText]);

  // Execute Analysis
  const handleAnalyze = async (customJd = null) => {
    const targetJd = customJd || jd;
    setErrorMessage("");
    setLoadingAction("analyze");
    const formData = createResumeFormData({ jd: targetJd });

    const doFetch = async () => {
      try {
        const data = await analyze(formData);
        setAnalysis(data);
        setPreviousView(currentView);
        setCurrentView("results");
      } catch (err) {
        setErrorMessage(err.message || "Failed to analyze resume. Please try again.");
        setRetryAction(() => () => handleAnalyze(customJd));
      } finally {
        setLoadingAction(null);
      }
    };

    await doFetch();
  };

  // Execute Job Matching
  const handleMatchJobs = async () => {
    setErrorMessage("");
    setLoadingAction("jobs");
    const formData = createResumeFormData({ location: "India" });

    const doFetch = async () => {
      try {
        const data = await matchJobs(formData);
        setRoles(data.roles || []);
        setPreviousView(currentView);
        setCurrentView("jobs");
      } catch (err) {
        setErrorMessage(err.message || "Failed to find matching jobs. Please try again.");
        setRetryAction(() => () => handleMatchJobs());
      } finally {
        setLoadingAction(null);
      }
    };

    await doFetch();
  };

  // Select a role from Jobs screen to analyze
  const handleSelectRoleForAnalysis = (role) => {
    if (role.sample_jd) {
      setJd(role.sample_jd);
      handleAnalyze(role.sample_jd);
    }
  };

  // Start Interview
  const handleStartInterview = () => {
    setCurrentQuestionIndex(0);
    setCurrentFeedback(null);
    setQa([]);
    setSummary(null);
    setPreviousView("results");
    setCurrentView("interview");
  };

  // Submit Answer to current interview question
  const handleAnswerSubmit = async ({ question, targets_gap, answer }) => {
    setErrorMessage("");
    setLoadingAction("answer");

    const payload = {
      jd,
      resume_text: resumeText || (analysis?.resume_text || ""),
      question,
      targets_gap,
      answer,
    };

    try {
      const feedback = await answerQuestion(payload);
      setCurrentFeedback(feedback);
      setQa((prev) => [
        ...prev,
        {
          question,
          answer,
          score: feedback.score || 7,
          targets_gap,
        },
      ]);
    } catch (err) {
      setErrorMessage(err.message || "Failed to evaluate answer. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  };

  // Skip question
  const handleSkipQuestion = async ({ question, targets_gap, answer }) => {
    setErrorMessage("");
    setLoadingAction("answer");

    const payload = {
      jd,
      resume_text: resumeText || (analysis?.resume_text || ""),
      question,
      targets_gap,
      answer: "Skipped question",
    };

    try {
      const feedback = await answerQuestion(payload);
      const skippedFeedback = {
        ...feedback,
        score: 3,
        strengths: ["Skipped question - review the model answer to practice this concept"],
      };
      setCurrentFeedback(skippedFeedback);
      setQa((prev) => [
        ...prev,
        {
          question,
          answer: "[Skipped]",
          score: 3,
          targets_gap,
        },
      ]);
    } catch (err) {
      setErrorMessage(err.message || "Failed to process skipped question.");
    } finally {
      setLoadingAction(null);
    }
  };

  // Advance to Next Question or Final Summary
  const handleNextQuestion = async () => {
    const questions = analysis?.questions || [];
    const isLast = currentQuestionIndex >= questions.length - 1;

    if (!isLast) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setCurrentFeedback(null);
    } else {
      // Generate summary
      setLoadingAction("summary");
      setErrorMessage("");
      try {
        const summaryData = await getSummary({
          jd,
          qa,
        });
        setSummary(summaryData);
        setPreviousView("interview");
        setCurrentView("scorecard");
      } catch (err) {
        setErrorMessage(err.message || "Failed to generate interview summary.");
      } finally {
        setLoadingAction(null);
      }
    }
  };

  // Retry interview
  const handleRetryInterview = () => {
    setCurrentQuestionIndex(0);
    setCurrentFeedback(null);
    setQa([]);
    setSummary(null);
    setCurrentView("interview");
  };

  // Try another role
  const handleTryAnotherRole = () => {
    setCurrentView("input");
  };

  return (
    <div className="app-layout">
      <Header
        currentView={currentView}
        setView={setCurrentView}
        isDark={theme === "dark"}
        toggleTheme={toggleTheme}
        hasAnalysis={!!analysis}
        hasJobs={roles.length > 0}
      />

      <main className="app-main">
        {errorMessage && (
          <ErrorBanner
            message={errorMessage}
            onRetry={retryAction}
            onDismiss={() => setErrorMessage("")}
          />
        )}

        {/* View: Input */}
        {currentView === "input" && (
          <>
            {loadingAction === "analyze" ? (
              <div className="loading-view-container">
                <div className="loading-status-bar">
                  <div className="loading-spinner" />
                  <span>Evaluating resume against JD & extracting keywords...</span>
                </div>
                <ResultsSkeleton />
              </div>
            ) : loadingAction === "jobs" ? (
              <div className="loading-view-container">
                <div className="loading-status-bar">
                  <div className="loading-spinner" />
                  <span>Matching resume with current tech roles in India...</span>
                </div>
                <JobsSkeleton />
              </div>
            ) : (
              <InputScreen
                resumeFile={resumeFile}
                setResumeFile={setResumeFile}
                resumeText={resumeText}
                setResumeText={setResumeText}
                resumeMode={resumeMode}
                setResumeMode={setResumeMode}
                jd={jd}
                setJd={setJd}
                onAnalyze={() => handleAnalyze()}
                onMatchJobs={handleMatchJobs}
                loading={!!loadingAction}
              />
            )}
          </>
        )}

        {/* View: Jobs */}
        {currentView === "jobs" && (
          <>
            {loadingAction === "analyze" ? (
              <div className="loading-view-container">
                <div className="loading-status-bar">
                  <div className="loading-spinner" />
                  <span>Analyzing resume for selected role...</span>
                </div>
                <ResultsSkeleton />
              </div>
            ) : (
              <JobsScreen
                roles={roles}
                onSelectRoleForAnalysis={handleSelectRoleForAnalysis}
                onBack={() => setCurrentView("input")}
                loading={!!loadingAction}
              />
            )}
          </>
        )}

        {/* View: Results */}
        {currentView === "results" && (
          <ResultsScreen
            analysis={analysis}
            onStartInterview={handleStartInterview}
            onBack={() => setCurrentView(previousView === "jobs" ? "jobs" : "input")}
          />
        )}

        {/* View: Interview */}
        {currentView === "interview" && (
          <>
            {loadingAction === "summary" ? (
              <div className="loading-view-container">
                <div className="loading-status-bar">
                  <div className="loading-spinner" />
                  <span>Generating comprehensive mock interview scorecard...</span>
                </div>
                <ResultsSkeleton />
              </div>
            ) : (
              <InterviewScreen
                questions={analysis?.questions || []}
                currentQuestionIndex={currentQuestionIndex}
                onAnswerSubmit={handleAnswerSubmit}
                onSkipQuestion={handleSkipQuestion}
                onNextQuestion={handleNextQuestion}
                feedback={currentFeedback}
                loadingFeedback={loadingAction === "answer"}
                onBackToResults={() => setCurrentView("results")}
                isFinished={qa.length >= (analysis?.questions?.length || 5)}
              />
            )}
          </>
        )}

        {/* View: Scorecard */}
        {currentView === "scorecard" && (
          <ScorecardScreen
            summary={summary}
            onRetryInterview={handleRetryInterview}
            onTryAnotherRole={handleTryAnotherRole}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>© 2026 ResumeCoach • AI Resume Optimization & Mock Technical Interviews</p>
      </footer>
    </div>
  );
}
