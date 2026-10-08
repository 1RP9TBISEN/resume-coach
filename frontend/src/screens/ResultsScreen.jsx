import React, { useState, useMemo } from "react";
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
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "../components/Icons";

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds non-overlapping highlighted segments from active JD and skill categories
 */
function useJdHighlights(jdText = "", skills = []) {
  return useMemo(() => {
    if (!jdText || !skills || skills.length === 0) {
      return { nodes: [jdText || ""], matchCounts: { matched: 0, partial: 0, missing: 0 } };
    }

    const termsMap = [];

    skills.forEach((skill) => {
      if (!skill || !skill.name) return;
      const name = skill.name.trim();
      const candidates = new Set();
      candidates.add(name);

      // Split on separators /, (, ), &, comma
      const parts = name.split(/[/(),&|]/).map((p) => p.trim()).filter(Boolean);
      parts.forEach((p) => {
        if (p.length >= 2) candidates.add(p);
        const words = p.split(/\s+/);
        if (words.length >= 2) {
          candidates.add(words.slice(0, 2).join(" "));
        }
      });

      // First two words of full name
      const allWords = name.split(/\s+/);
      if (allWords.length >= 2) {
        candidates.add(allWords.slice(0, 2).join(" "));
      }

      // Framework aliases
      if (/react\.js/i.test(name)) candidates.add("React");
      if (/node\.js/i.test(name)) candidates.add("Node");
      if (/vue\.js/i.test(name)) candidates.add("Vue");
      if (/next\.js/i.test(name)) candidates.add("Next.js").add("Next");
      if (/fastapi/i.test(name)) candidates.add("FastAPI");
      if (/sqlite/i.test(name)) candidates.add("SQLite");
      if (/postgres/i.test(name)) candidates.add("PostgreSQL").add("Postgres");

      candidates.forEach((term) => {
        const clean = term.trim();
        if (clean.length < 2) return;
        // Ignore generic stop words that might match accidentally
        if (/^(and|the|for|with|web|apps|app|code|test|data|work|good)$/i.test(clean)) return;

        const escaped = escapeRegex(clean);
        // Word boundary matching handling symbols like C++, Node.js
        const pattern = new RegExp(`(?<=(?:^|\\b|\\s|[.,;:!?(\"'`]))${escaped}(?=(?:$|\\b|\\s|[.,;:!?)\"'`]))`, "gi");

        termsMap.push({
          term: clean,
          pattern,
          length: clean.length,
          skill,
        });
      });
    });

    // Sort longest candidate term first
    termsMap.sort((a, b) => b.length - a.length);

    // Find all matches
    const allMatches = [];
    termsMap.forEach(({ pattern, skill }) => {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(jdText)) !== null) {
        allMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          skill,
        });
      }
    });

    // Sort matches by start position, then longest first
    allMatches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

    // Filter out overlapping intervals
    const nonOverlapping = [];
    let lastEnd = 0;
    for (const m of allMatches) {
      if (m.start >= lastEnd) {
        nonOverlapping.push(m);
        lastEnd = m.end;
      }
    }

    // Tally unique matched skills for legend
    const matchCounts = { matched: 0, partial: 0, missing: 0 };
    const matchedSkillsSet = new Set();

    nonOverlapping.forEach((m) => {
      const status = m.skill.status || "missing";
      if (!matchedSkillsSet.has(m.skill.name)) {
        matchedSkillsSet.add(m.skill.name);
        if (matchCounts[status] !== undefined) {
          matchCounts[status]++;
        }
      }
    });

    // Generate output tokens
    const nodes = [];
    let currentIndex = 0;

    nonOverlapping.forEach((m, idx) => {
      if (m.start > currentIndex) {
        nodes.push(jdText.slice(currentIndex, m.start));
      }
      const status = m.skill.status || "missing";
      const tooltip = m.skill.evidence
        ? `${m.skill.name} (${status.toUpperCase()}): ${m.skill.evidence}`
        : `${m.skill.name} (${status.toUpperCase()}): Not found in resume`;

      nodes.push(
        <mark
          key={`hl-${idx}-${m.start}`}
          className={`jd-hl-tag jd-hl-${status}`}
          title={tooltip}
        >
          {m.text}
        </mark>
      );
      currentIndex = m.end;
    });

    if (currentIndex < jdText.length) {
      nodes.push(jdText.slice(currentIndex));
    }

    return { nodes, matchCounts };
  }, [jdText, skills]);
}

export default function ResultsScreen({
  analysis,
  jd = "",
  onStartInterview,
  onBack,
}) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isJdCardOpen, setIsJdCardOpen] = useState(true);

  if (!analysis) return null;

  const {
    match_score = 0,
    verdict = "",
    breakdown = [],
    skills = [],
    gaps = [],
    rewrites = [],
    questions = [],
  } = analysis;

  const handleCopyRewrite = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const handlePrint = () => {
    window.print();
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

  // Highlighted JD nodes and stats
  const { nodes: jdHighlightNodes, matchCounts } = useJdHighlights(jd, skills);

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
          <h1 className="print-title">ResumeCoach Report</h1>
          <span className="print-date">{formattedDate}</span>
        </div>
        <p className="print-subtitle">Comprehensive Resume Analysis & Technical Readiness Evaluation</p>
      </div>

      {/* Top Navigation */}
      <div className="screen-header-row no-print">
        <button type="button" className="btn-back" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div className="results-cta-buttons">
          <button type="button" className="btn-secondary btn-print-report" onClick={handlePrint} title="Print or save as PDF">
            <span>📄 Download Report</span>
          </button>
          <button type="button" className="btn-secondary btn-cta-start" onClick={() => onStartInterview(false)}>
            <MessageSquare size={16} />
            <span>Text Interview</span>
          </button>
          <button type="button" className="btn-primary btn-cta-start" onClick={() => onStartInterview(true)}>
            <Sparkles size={16} />
            <span>🎙 Start Voice Interview ({questions.length || 5} Qs)</span>
            <ArrowRight size={16} />
          </button>
        </div>
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

      {/* Feature 1: JD Keyword Highlighting (Collapsible, open by default) */}
      {jd && (
        <section className="results-section jd-keyword-section">
          <div className="jd-keyword-card">
            <button
              type="button"
              className="jd-keyword-toggle"
              onClick={() => setIsJdCardOpen(!isJdCardOpen)}
              aria-expanded={isJdCardOpen}
            >
              <div className="jd-keyword-header-left">
                <FileText size={18} className="text-accent" />
                <span className="jd-keyword-title">Job description — keyword check</span>
              </div>

              <div className="jd-keyword-header-right">
                <div className="jd-keyword-legend">
                  <span className="legend-item legend-matched">✓ {matchCounts.matched} matched</span>
                  <span className="legend-divider">·</span>
                  <span className="legend-item legend-partial">~ {matchCounts.partial} partial</span>
                  <span className="legend-divider">·</span>
                  <span className="legend-item legend-missing">✗ {matchCounts.missing} missing</span>
                </div>
                {isJdCardOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {isJdCardOpen && (
              <div className="jd-keyword-content fade-in">
                <div className="jd-keyword-hint">
                  Hover over any highlighted skill keyword to view evidence from your resume or fix tips.
                </div>
                <div className="jd-highlighted-text">
                  {jdHighlightNodes}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

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
                      className={`btn-copy ${copiedIndex === idx ? "copied" : ""} no-print`}
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
      <div className="bottom-cta-banner no-print">
        <div className="cta-text">
          <h3>Ready to test your answers in a real interview?</h3>
          <p>Practice answering technical and behavioral questions generated directly from your target JD gaps.</p>
        </div>
        <div className="bottom-cta-actions">
          <button type="button" className="btn-secondary btn-print-report" onClick={handlePrint}>
            <span>📄 Download Report</span>
          </button>
          <button type="button" className="btn-secondary btn-cta-large" onClick={() => onStartInterview(false)}>
            <MessageSquare size={18} />
            <span>Text Mode</span>
          </button>
          <button type="button" className="btn-primary btn-cta-large" onClick={() => onStartInterview(true)}>
            <Sparkles size={18} />
            <span>🎙 Start Voice Interview</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
