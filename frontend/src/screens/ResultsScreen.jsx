import React, { useState } from "react";
import ScoreRing from "../components/ScoreRing";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Copy,
  Check,
  Zap,
  Target,
  FileText,
  MessageSquare
} from "../components/Icons";

export default function ResultsScreen({ analysis, onStartInterview, onBack }) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // all | gaps | rewrites | skills

  if (!analysis) return null;

  const {
    match_score = 0,
    verdict = "",
    breakdown = [],
    skills = [],
    gaps = [],
    rewrites = [],
    questions = []
  } = analysis;

  const handleCopyRewrite = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  // Sort skills: high importance first, then medium, then low
  const importanceWeight = { high: 3, medium: 2, low: 1 };
  const sortedSkills = [...skills].sort((a, b) => {
    const weightA = importanceWeight[a.importance?.toLowerCase()] || 0;
    const weightB = importanceWeight[b.importance?.toLowerCase()] || 0;
    return weightB - weightA;
  });

  const matchedSkills = sortedSkills.filter((s) => s.status === "matched");
  const partialSkills = sortedSkills.filter((s) => s.status === "partial");
  const missingSkills = sortedSkills.filter((s) => s.status === "missing");

  return (
    <div className="screen-container fade-in">
      {/* Top Navigation */}
      <div className="screen-header-row">
        <button type="button" className="btn-back" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <button type="button" className="btn-primary btn-cta-start" onClick={onStartInterview}>
          <MessageSquare size={16} />
          <span>{questions.length > 0 ? `Start Mock Interview (${questions.length} Questions)` : "Start Mock Interview"}</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Hero Overview Card */}
      <div className="results-hero-card">
        <div className="results-hero-left">
          <ScoreRing score={match_score} size={150} strokeWidth={11} label="Match Score" />
        </div>

        <div className="results-hero-right">
          <div className="verdict-tag">
            <Sparkles size={15} /> Match Verdict
          </div>
          <p className="verdict-text">{verdict}</p>

          {/* Breakdown Bars */}
          <div className="breakdown-grid">
            {breakdown.map((item, idx) => {
              const scoreVal = Math.min(100, Math.max(0, item.score || 0));
              let barColor = "#10b981";
              if (scoreVal < 50) barColor = "#ef4444";
              else if (scoreVal < 75) barColor = "#f59e0b";

              return (
                <div key={idx} className="breakdown-item">
                  <div className="breakdown-label-row">
                    <span className="breakdown-label">{item.label}</span>
                    <span className="breakdown-score" style={{ color: barColor }}>
                      {scoreVal}%
                    </span>
                  </div>
                  <div className="breakdown-bar-track">
                    <div
                      className="breakdown-bar-fill"
                      style={{
                        width: `${scoreVal}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 1: Skills Breakdown */}
      <section className="results-section">
        <div className="section-header">
          <div className="section-title-group">
            <Zap size={20} className="section-title-icon text-accent" />
            <h2>Skills Analysis</h2>
          </div>
          <span className="section-counter-badge">{skills.length} evaluated</span>
        </div>

        <div className="skills-status-columns">
          {/* Matched */}
          <div className="skill-column column-matched">
            <div className="column-header">
              <CheckCircle2 size={16} className="text-success" />
              <h3>Matched ({matchedSkills.length})</h3>
            </div>
            <div className="skills-pill-list">
              {matchedSkills.map((sk, idx) => (
                <div key={idx} className="skill-detail-card card-matched">
                  <div className="skill-header">
                    <span className="skill-name">{sk.name}</span>
                    <span className={`importance-tag imp-${sk.importance || "medium"}`}>
                      {sk.importance || "medium"}
                    </span>
                  </div>
                  {sk.evidence && <p className="skill-evidence">{sk.evidence}</p>}
                </div>
              ))}
              {matchedSkills.length === 0 && <div className="muted-text">No matched skills detected</div>}
            </div>
          </div>

          {/* Partial */}
          <div className="skill-column column-partial">
            <div className="column-header">
              <HelpCircle size={16} className="text-warning" />
              <h3>Partial Match ({partialSkills.length})</h3>
            </div>
            <div className="skills-pill-list">
              {partialSkills.map((sk, idx) => (
                <div key={idx} className="skill-detail-card card-partial">
                  <div className="skill-header">
                    <span className="skill-name">{sk.name}</span>
                    <span className={`importance-tag imp-${sk.importance || "medium"}`}>
                      {sk.importance || "medium"}
                    </span>
                  </div>
                  {sk.evidence && <p className="skill-evidence">{sk.evidence}</p>}
                </div>
              ))}
              {partialSkills.length === 0 && <div className="muted-text">No partial matches</div>}
            </div>
          </div>

          {/* Missing */}
          <div className="skill-column column-missing">
            <div className="column-header">
              <AlertCircle size={16} className="text-danger" />
              <h3>Missing from Resume ({missingSkills.length})</h3>
            </div>
            <div className="skills-pill-list">
              {missingSkills.map((sk, idx) => (
                <div key={idx} className="skill-detail-card card-missing">
                  <div className="skill-header">
                    <span className="skill-name">{sk.name}</span>
                    <span className={`importance-tag imp-${sk.importance || "medium"}`}>
                      {sk.importance || "medium"}
                    </span>
                  </div>
                  <p className="skill-evidence missing-note">
                    Not found in resume. Recommended to learn or mention project exposure.
                  </p>
                </div>
              ))}
              {missingSkills.length === 0 && <div className="muted-text">No missing skills</div>}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Resume Gaps & How to Fix */}
      <section className="results-section">
        <div className="section-header">
          <div className="section-title-group">
            <Target size={20} className="section-title-icon text-warning" />
            <h2>Identified Experience Gaps ({gaps.length})</h2>
          </div>
        </div>

        <div className="gaps-grid">
          {gaps.map((gapItem, idx) => (
            <div key={idx} className="gap-card">
              <div className="gap-card-header">
                <span className="gap-badge">Gap #{idx + 1}</span>
                <h3 className="gap-title">{gapItem.gap}</h3>
              </div>

              <div className="gap-body">
                <div className="gap-info-row">
                  <strong>Why it matters:</strong>
                  <p>{gapItem.why_it_matters}</p>
                </div>

                <div className="gap-fix-box">
                  <div className="gap-fix-header">
                    <Sparkles size={14} /> <span>How to fix:</span>
                  </div>
                  <p>{gapItem.how_to_fix}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: AI Bullet Rewrites */}
      <section className="results-section">
        <div className="section-header">
          <div className="section-title-group">
            <FileText size={20} className="section-title-icon text-accent" />
            <h2>High-Impact Resume Rewrites ({rewrites.length})</h2>
          </div>
          <span className="section-hint">Optimized with action verbs, metrics, and JD keywords</span>
        </div>

        <div className="rewrites-list">
          {rewrites.map((item, idx) => (
            <div key={idx} className="rewrite-card">
              <div className="rewrite-columns">
                {/* Before */}
                <div className="rewrite-col before-col">
                  <div className="rewrite-col-header">
                    <span className="col-label before-label">Original Bullet</span>
                  </div>
                  <div className="rewrite-content original-text">{item.original}</div>
                </div>

                {/* After */}
                <div className="rewrite-col after-col">
                  <div className="rewrite-col-header">
                    <span className="col-label after-label">
                      <Sparkles size={13} /> Improved Bullet (Impact & Metrics)
                    </span>
                    <button
                      type="button"
                      className={`btn-copy ${copiedIndex === idx ? "copied" : ""}`}
                      onClick={() => handleCopyRewrite(item.improved, idx)}
                      title="Copy improved bullet"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check size={14} /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="rewrite-content improved-text">{item.improved}</div>
                </div>
              </div>

              {/* Rationale & Keyword Tags */}
              <div className="rewrite-footer">
                <div className="rewrite-reason">
                  <strong>Rationale:</strong> {item.reason}
                </div>
                {item.jd_keywords && item.jd_keywords.length > 0 && (
                  <div className="rewrite-keywords">
                    <span className="kw-label">Target Keywords:</span>
                    {item.jd_keywords.map((kw, kIdx) => (
                      <span key={kIdx} className="keyword-chip">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="bottom-cta-banner">
        <div className="cta-text">
          <h3>Ready to test your answers in a real interview?</h3>
          <p>Practice answering technical and behavioral questions generated directly from your target JD gaps.</p>
        </div>
        <button type="button" className="btn-primary btn-cta-large" onClick={onStartInterview}>
          <MessageSquare size={18} />
          <span>Start Mock Interview</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
