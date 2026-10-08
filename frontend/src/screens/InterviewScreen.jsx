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
  HelpCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Check,
} from "../components/Icons";
import { FeedbackSkeleton } from "../components/LoadingSkeleton";
import { useVoiceInterview, isVoiceSupported } from "../hooks/useVoiceInterview";

export default function InterviewScreen({
  questions = [],
  currentQuestionIndex = 0,
  onAnswerSubmit,
  onSkipQuestion,
  onNextQuestion,
  feedback,
  loadingFeedback,
  showColdStartNotice,
  onBackToResults,
  isFinished,
  initialVoiceMode = false,
  setErrorMessage,
}) {
  const [userAnswer, setUserAnswer] = useState("");
  const [showBetterAnswer, setShowBetterAnswer] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(initialVoiceMode);
  const textareaRef = useRef(null);

  const voiceSupported = isVoiceSupported();

  // Fallback question if list is empty
  const defaultQuestion = {
    id: 1,
    question: "Walk me through your most challenging frontend or full-stack project. What architectural decisions did you make?",
    type: "technical",
    targets_gap: "Project Architecture & Technical Depth",
  };

  const safeQuestions = questions.length > 0 ? questions : [defaultQuestion];
  const currentQ = safeQuestions[currentQuestionIndex] || safeQuestions[0] || defaultQuestion;
  const totalQuestions = safeQuestions.length;
  const progressPercent = Math.min(100, Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100));
  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;

  // Voice Interview Loop hook
  const {
    voiceStatus,
    audioLevel,
    transcriptPreview,
    startQuestionLoop,
    skipSpeakingAndListen,
    finishRecordingEarly,
    togglePause,
    isPaused,
    fallbackToTyping,
  } = useVoiceInterview({
    currentQuestion: currentQ,
    isVoiceMode,
    setIsVoiceMode,
    onAnswerSubmit,
    onNextQuestion,
    isLastQuestion,
    currentFeedback: feedback,
    loadingFeedback,
    setErrorMessage,
  });

  // Reset textarea & collapse stronger answer on question change
  useEffect(() => {
    setUserAnswer("");
    setShowBetterAnswer(false);
    if (!isVoiceMode && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentQuestionIndex, isVoiceMode]);

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
    if (isVoiceMode) {
      fallbackToTyping();
    }
    onSkipQuestion({
      question: currentQ.question,
      targets_gap: currentQ.targets_gap || "",
      answer: "[Skipped question]",
    });
  };

  const startVoiceInterview = () => {
    setIsVoiceMode(true);
  };

  // Type badge styling
  const typeMap = {
    technical: { label: "Technical", class: "badge-technical" },
    behavioral: { label: "Behavioral (STAR)", class: "badge-behavioral" },
    situational: { label: "Situational / System", class: "badge-situational" },
  };
  const qType = typeMap[currentQ.type?.toLowerCase()] || { label: currentQ.type || "Technical", class: "badge-technical" };

  return (
    <div className="screen-container fade-in">
      {/* Top Header & Progress */}
      <div className="interview-top-bar">
        <button
          type="button"
          className="btn-back"
          onClick={() => {
            if (isVoiceMode) fallbackToTyping();
            onBackToResults();
          }}
        >
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

      {/* Mode Switcher Banner (when not in voice mode) */}
      {!isVoiceMode && voiceSupported && (
        <div className="voice-mode-prompt-banner fade-in">
          <div className="voice-prompt-left">
            <div className="mic-icon-circle">
              <Mic size={18} />
            </div>
            <div>
              <strong>Prefer talking out loud?</strong>
              <p>Practice hands-free with real-time AI speech and voice evaluation.</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-primary btn-start-voice"
            onClick={startVoiceInterview}
          >
            <Mic size={16} />
            <span>🎙 Start Voice Interview</span>
          </button>
        </div>
      )}

      {/* Main Chat / Interview Card */}
      <div className={`interview-chat-card ${isVoiceMode ? "voice-card-active" : ""}`}>
        {/* Voice Mode Header Bar (Active when in Voice Mode) */}
        {isVoiceMode && (
          <div className="voice-active-header fade-in">
            <div className="voice-status-indicator">
              <span className={`voice-pulse-dot ${voiceStatus}`} />
              <span className="voice-status-label">
                {voiceStatus === "speaking" && "🎙 Interviewer speaking… (tap bubble to skip)"}
                {voiceStatus === "listening" && "🎧 Listening to your answer…"}
                {voiceStatus === "thinking" && "✨ Transcribing & analyzing response…"}
                {voiceStatus === "responding" && "🗣 Speaking score & feedback…"}
                {voiceStatus === "paused" && "⏸ Voice loop paused"}
                {voiceStatus === "idle" && "🎙 Hands-free Voice Mode ready"}
              </span>
            </div>

            {/* Always Visible Voice Controls */}
            <div className="voice-controls-row">
              <button
                type="button"
                className="btn-voice-control"
                onClick={togglePause}
                title={isPaused ? "Resume voice loop" : "Pause voice loop"}
              >
                {isPaused ? <Play size={14} /> : <Pause size={14} />}
                <span>{isPaused ? "Resume" : "Pause"}</span>
              </button>

              {voiceStatus === "listening" && (
                <button
                  type="button"
                  className="btn-voice-control btn-done"
                  onClick={finishRecordingEarly}
                  title="Finish recording now"
                >
                  <Check size={14} />
                  <span>I'm done</span>
                </button>
              )}

              <button
                type="button"
                className="btn-voice-control btn-switch-type"
                onClick={() => fallbackToTyping()}
                title="Switch to typing text"
              >
                <MessageSquare size={14} />
                <span>Switch to typing</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Audio Visualizer Wave (Active when Listening in Voice Mode) */}
        {isVoiceMode && voiceStatus === "listening" && (
          <div className="mic-visualizer-container fade-in">
            <div className="mic-pulse-ring" style={{ transform: `scale(${1 + audioLevel * 0.012})` }}>
              <Mic size={24} className="mic-active-icon" />
            </div>
            <div className="audio-meter-bar-track">
              <div
                className="audio-meter-bar-fill"
                style={{ width: `${Math.min(100, audioLevel * 1.5)}%` }}
              />
            </div>
            <span className="mic-listening-hint">
              Speak your answer clearly. Pausing for 2s will automatically submit.
            </span>
          </div>
        )}

        {/* Interviewer Bubble */}
        <div
          className={`interviewer-bubble fade-in ${voiceStatus === "speaking" ? "bubble-speaking" : ""}`}
          onClick={skipSpeakingAndListen}
          role={voiceStatus === "speaking" ? "button" : undefined}
          title={voiceStatus === "speaking" ? "Tap to skip reading and start speaking" : undefined}
          tabIndex={voiceStatus === "speaking" ? 0 : undefined}
        >
          <div className="bubble-avatar">
            {voiceStatus === "speaking" ? <Volume2 size={20} className="pulse-icon" /> : <Sparkles size={20} />}
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
              {voiceStatus === "speaking" && (
                <span className="skip-speech-pill">Tap bubble to skip speech ↷</span>
              )}
            </div>
            <div className="question-text">{currentQ.question}</div>
          </div>
        </div>

        {/* User Spoken Transcript Bubble in Voice Mode */}
        {isVoiceMode && (transcriptPreview || voiceStatus === "thinking") && (
          <div className="user-spoken-bubble fade-in">
            <div className="user-bubble-content">
              <span className="user-bubble-label">🎙 Your Spoken Answer:</span>
              <p className="user-transcript-text">
                {transcriptPreview || "Transcribing your voice response…"}
              </p>
            </div>
          </div>
        )}

        {/* User Text Input Area (When NOT in Voice Mode) */}
        {!isVoiceMode && !feedback && !loadingFeedback && (
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
              <span>Scoring your response against technical rubrics…</span>
            </div>
            {showColdStartNotice && (
              <div className="cold-start-banner fade-in" style={{ marginBottom: "12px" }}>
                ⏳ Waking up the AI server, this can take ~30s the first time…
              </div>
            )}
            <FeedbackSkeleton />
          </div>
        )}

        {/* Evaluation Feedback Card */}
        {feedback && (
          <div className="feedback-card fade-in">
            <div className="feedback-header">
              <div className="feedback-score-badge">
                <span className="feedback-score-num">{feedback.score !== undefined ? feedback.score : 7}</span>
                <span className="feedback-score-denom">/ 10</span>
              </div>
              <div className="feedback-verdict-title">
                {(feedback.score || 0) >= 8 ? (
                  <span className="text-success">
                    <CheckCircle2 size={18} /> Excellent Response!
                  </span>
                ) : (feedback.score || 0) >= 6 ? (
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
              {isVoiceMode && (
                <span className="voice-auto-advance-note">
                  🎙 Advancing automatically after voice evaluation…
                </span>
              )}
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
