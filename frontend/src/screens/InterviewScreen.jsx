import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Zap,
  HelpCircle
} from "../components/Icons";
import { FeedbackSkeleton } from "../components/LoadingSkeleton";

export default function InterviewScreen({
  questions = [],
  currentQuestionIndex,
  onAnswerSubmit,
  onSkipQuestion,
  onNextQuestion,
  feedback,
  loadingFeedback,
  onBackToResults,
  isFinished,
}) {
  const [userAnswer, setUserAnswer] = useState("");
  const [showBetterAnswer, setShowBetterAnswer] = useState(false);
  const textareaRef = useRef(null);

  const currentQ = questions[currentQuestionIndex] || {
    id: 1,
    question: "Tell me about your technical background and experience.",
    type: "technical",
    targets_gap: "Core Technical Background",
  };

  const totalQuestions = questions.length || 5;
  const progressPercent = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);

  // Reset textarea when question changes
  useEffect(() => {
    setUserAnswer("");
    setShowBetterAnswer(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentQuestionIndex]);

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (userAnswer.trim().length > 0 && !loadingFeedback && !feedback) {
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (!userAnswer.trim() || loadingFeedback) return;
    onAnswerSubmit({
      question: currentQ.question,
      targets_gap: currentQ.targets_gap || "",
      answer: userAnswer.trim(),
    });
  };

  const handleSkip = () => {
    if (loadingFeedback) return;
    onSkipQuestion({
      question: currentQ.question,
      targets_gap: currentQ.targets_gap || "",
      answer: "[Skipped question]",
    });
  };

  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  // Type badge styling
  const typeMap = {
    technical: { label: "Technical", class: "badge-technical" },
    behavioral: { label: "Behavioral (STAR)", class: "badge-behavioral" },
    situational: { label: "Situational / System", class: "badge-situational" },
  };
  const qType = typeMap[currentQ.type?.toLowerCase()] || { label: currentQ.type || "Interview", class: "badge-technical" };

  return (
    <div className="screen-container fade-in">
      {/* Top Header & Progress */}
      <div className="interview-top-bar">
        <button type="button" className="btn-back" onClick={onBackToResults}>
          <ArrowLeft size={16} />
          <span>Back to Analysis</span>
        </button>

        <div className="interview-progress-wrapper">
          <div className="progress-info-row">
            <span className="progress-step-text">
              Question <strong>{currentQuestionIndex + 1}</strong> of <strong>{totalQuestions}</strong>
            </span>
            <span className="progress-pct-text">{progressPercent}% complete</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Chat / Interview Area */}
      <div className="interview-chat-card">
        {/* Interviewer Bubble */}
        <div className="interviewer-bubble fade-in">
          <div className="bubble-avatar">
            <Sparkles size={20} />
          </div>
          <div className="bubble-content">
            <div className="bubble-meta">
              <span className="interviewer-name">AI Technical Coach</span>
              <span className={`q-type-badge ${qType.class}`}>{qType.label}</span>
              {currentQ.targets_gap && (
                <span className="q-targets-gap">
                  Targets: <strong>{currentQ.targets_gap}</strong>
                </span>
              )}
            </div>
            <div className="question-text">{currentQ.question}</div>
          </div>
        </div>

        {/* User Input or Answer State */}
        {!feedback && !loadingFeedback && (
          <div className="user-answer-container fade-in">
            <div className="user-input-header">
              <span className="user-input-label">Your Response</span>
              <span className="shortcut-hint">Press <kbd>Cmd</kbd> + <kbd>Enter</kbd> to submit</span>
            </div>

            <textarea
              ref={textareaRef}
              rows={6}
              className="user-answer-textarea"
              placeholder="Type your response here... (Tip: Structure your answer using Situation, Task, Action, Result / STAR method)"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <div className="user-actions-row">
              <button
                type="button"
                className="btn-skip"
                onClick={handleSkip}
                disabled={loadingFeedback}
              >
                Skip Question
              </button>

              <button
                type="button"
                className="btn-primary btn-submit-answer"
                onClick={handleSubmit}
                disabled={!userAnswer.trim() || loadingFeedback}
              >
                <Send size={16} />
                <span>Submit Answer</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading Feedback State */}
        {loadingFeedback && (
          <div className="feedback-loading-state">
            <div className="evaluating-banner">
              <Sparkles size={18} className="spin-icon text-accent" />
              <span>Evaluating your response against industry rubrics...</span>
            </div>
            <FeedbackSkeleton />
          </div>
        )}

        {/* Evaluation Feedback Card */}
        {feedback && (
          <div className="feedback-card fade-in">
            <div className="feedback-header">
              <div className="feedback-score-badge">
                <span className="feedback-score-num">{feedback.score}</span>
                <span className="feedback-score-denom">/ 10</span>
              </div>
              <div className="feedback-verdict-title">
                {feedback.score >= 8 ? (
                  <span className="text-success">
                    <CheckCircle2 size={18} /> Excellent Response!
                  </span>
                ) : feedback.score >= 6 ? (
                  <span className="text-warning">
                    <HelpCircle size={18} /> Good attempt with room for improvement
                  </span>
                ) : (
                  <span className="text-danger">
                    <AlertCircle size={18} /> Needs revision & concrete detail
                  </span>
                )}
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="feedback-grid">
              {feedback.strengths && feedback.strengths.length > 0 && (
                <div className="feedback-col strengths-col">
                  <span className="col-heading text-success">
                    <CheckCircle2 size={15} /> Key Strengths
                  </span>
                  <ul className="feedback-bullets">
                    {feedback.strengths.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.improvements && feedback.improvements.length > 0 && (
                <div className="feedback-col improvements-col">
                  <span className="col-heading text-warning">
                    <AlertCircle size={15} /> Areas for Improvement
                  </span>
                  <ul className="feedback-bullets">
                    {feedback.improvements.map((imp, idx) => (
                      <li key={idx}>{imp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Collapsible Stronger Answer */}
            {feedback.better_answer && (
              <div className="better-answer-accordion">
                <button
                  type="button"
                  className="accordion-toggle"
                  onClick={() => setShowBetterAnswer(!showBetterAnswer)}
                >
                  <div className="accordion-title">
                    <Sparkles size={16} className="text-accent" />
                    <span>View Model / Stronger Answer</span>
                  </div>
                  {showBetterAnswer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showBetterAnswer && (
                  <div className="better-answer-content fade-in">
                    <p>{feedback.better_answer}</p>
                  </div>
                )}
              </div>
            )}

            {/* Next Question CTA */}
            <div className="feedback-footer">
              <button
                type="button"
                className="btn-primary btn-next-q"
                onClick={onNextQuestion}
              >
                <span>{isLastQuestion ? "View Comprehensive Scorecard" : "Next Question"}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
