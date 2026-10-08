import React, { useEffect } from "react";
import ScoreRing from "../components/ScoreRing";
import {
  RotateCcw,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Award,
  Target,
  FileText
} from "../components/Icons";

export default function ScorecardScreen({
  summary,
  onRetryInterview,
  onTryAnotherRole,
  wasVoiceMode = false
}) {
  if (!summary) return null;

  const {
    overall_score = 0,
    readiness = "almost",
    top_strengths = [],
    focus_areas = [],
    next_steps = []
  } = summary;

  const handlePrint = () => {
    window.print();
  };

  // Readiness badge config
  const readinessConfig = {
    ready: {
      label: "Interview Ready",
      sublabel: "Strong candidate profile with high confidence",
      class: "readiness-ready",
      color: "#10b981",
    },
    almost: {
      label: "Almost Ready",
      sublabel: "Minor gaps to patch before live interviews",
      class: "readiness-almost",
      color: "#f59e0b",
    },
    not_yet: {
      label: "Needs Preparation",
      sublabel: "Address core skill gaps and revise project answers",
      class: "readiness-not-yet",
      color: "#ef4444",
    },
  };

  const currentReadiness = readinessConfig[readiness?.toLowerCase()] || readinessConfig.almost;

  // Read out the scorecard summary if voice mode was active
  useEffect(() => {
    if (wasVoiceMode && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const text = `Congratulations on completing your mock interview! Your overall score is ${overall_score} percent. Your readiness assessment is: ${currentReadiness.label}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, [wasVoiceMode, overall_score, currentReadiness.label]);

  const formattedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="screen-container fade-in">
      {/* Print Document Header (Visible only in Print mode) */}
      <div className="print-only-header">
        <div className="print-header-top">
          <h1 className="print-title">ResumeCoach Report — Mock Interview Scorecard</h1>
          <span className="print-date">{formattedDate}</span>
        </div>
        <p className="print-subtitle">Comprehensive Technical Interview Assessment & Readiness Feedback</p>
      </div>

      <div className="scorecard-hero-card">
        <div className="scorecard-hero-center">
          <ScoreRing score={overall_score} size={180} strokeWidth={14} label="Overall Score" />

          <div className="readiness-banner" style={{ marginTop: "18px" }}>
            <div className={`readiness-pill ${currentReadiness.class}`}>
              <Award size={18} />
              <span>{currentReadiness.label}</span>
            </div>
            <p className="readiness-description">{currentReadiness.sublabel}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="scorecard-actions-row no-print">
          <button type="button" className="btn-secondary btn-print-report" onClick={handlePrint}>
            <span>📄 Download Report</span>
          </button>

          <button type="button" className="btn-secondary" onClick={onRetryInterview}>
            <RotateCcw size={16} />
            <span>Retry Interview</span>
          </button>

          <button type="button" className="btn-primary" onClick={onTryAnotherRole}>
            <Briefcase size={16} />
            <span>Try Another Role / Input</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* 3 Summary Sections */}
      <div className="scorecard-details-grid">
        {/* Top Strengths */}
        <div className="scorecard-section-card">
          <div className="card-section-header">
            <CheckCircle2 size={20} className="text-success" />
            <h3>Top Demonstrated Strengths</h3>
          </div>
          <ul className="scorecard-list">
            {top_strengths.map((str, idx) => (
              <li key={idx} className="list-item-success">
                <span className="bullet-point">✓</span>
                <span>{str}</span>
              </li>
            ))}
            {top_strengths.length === 0 && <li className="muted-text">None recorded</li>}
          </ul>
        </div>

        {/* Focus Areas */}
        <div className="scorecard-section-card">
          <div className="card-section-header">
            <Target size={20} className="text-warning" />
            <h3>Key Focus Areas</h3>
          </div>
          <ul className="scorecard-list">
            {focus_areas.map((fa, idx) => (
              <li key={idx} className="list-item-warning">
                <span className="bullet-point">!</span>
                <span>{fa}</span>
              </li>
            ))}
            {focus_areas.length === 0 && <li className="muted-text">None recorded</li>}
          </ul>
        </div>

        {/* Recommended Next Steps */}
        <div className="scorecard-section-card full-width-card">
          <div className="card-section-header">
            <Sparkles size={20} className="text-accent" />
            <h3>Recommended Action Plan</h3>
          </div>
          <div className="next-steps-grid">
            {next_steps.map((ns, idx) => (
              <div key={idx} className="next-step-box">
                <span className="step-num-circle">{idx + 1}</span>
                <p className="step-text">{ns}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
