import React, { useState, useRef } from "react";
import { Upload, FileText, Sparkles, Briefcase, AlertCircle, CheckCircle2, ArrowRight } from "../components/Icons";
import { SAMPLE_RESUME_TEXT, SAMPLE_JD_TEXT } from "../sampleData";

export default function InputScreen({
  resumeFile,
  setResumeFile,
  resumeText,
  setResumeText,
  resumeMode,
  setResumeMode,
  jd,
  setJd,
  onAnalyze,
  onMatchJobs,
  loading,
}) {
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleFileChange = (file) => {
    setFileError("");
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setFileError("Only PDF resumes are supported. Please upload a .pdf file or switch to paste text.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller file.`);
      return;
    }

    setResumeFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleLoadSample = () => {
    setResumeMode("text");
    setResumeFile(null);
    setResumeText(SAMPLE_RESUME_TEXT);
    setJd(SAMPLE_JD_TEXT);
    setFileError("");
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const jdCharCount = jd.trim().length;
  const isJdValid = jdCharCount >= 100 && jdCharCount <= 8000;
  const hasResume = resumeMode === "file" ? !!resumeFile : resumeText.trim().length >= 50;

  const canAnalyze = hasResume && isJdValid && !loading;
  const canMatchJobs = hasResume && !loading;

  return (
    <div className="screen-container fade-in">
      <div className="hero-banner">
        <div className="badge-pill">
          <Sparkles size={14} /> AI-Powered Career Prep
        </div>
        <h1 className="hero-title">Optimize Your Resume & Master Technical Interviews</h1>
        <p className="hero-subtitle">
          Get instant ATS gap analysis, bullet-point rewrites, matching tech jobs in India, and personalized mock interview practice.
        </p>
        <div className="hero-actions">
          <button type="button" className="btn-secondary btn-sample" onClick={handleLoadSample}>
            <Sparkles size={16} />
            <span>Load Sample (Student Resume + Frontend JD)</span>
          </button>
        </div>
      </div>

      <div className="input-grid">
        {/* Left Column: Resume Input */}
        <section className="input-card">
          <div className="card-header-row">
            <div className="card-title-group">
              <FileText size={20} className="card-title-icon" />
              <h2>Your Resume</h2>
            </div>
            <button
              type="button"
              className="text-toggle-btn"
              onClick={() => {
                setResumeMode(resumeMode === "file" ? "text" : "file");
                setFileError("");
              }}
            >
              {resumeMode === "file" ? "Paste resume text instead" : "Upload PDF file instead"}
            </button>
          </div>

          {resumeMode === "file" ? (
            <div className="upload-container">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden-file-input"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <div
                className={`dropzone ${isDragging ? "dragging" : ""} ${resumeFile ? "has-file" : ""}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    fileInputRef.current?.click();
                  }
                }}
              >
                {resumeFile ? (
                  <div className="file-preview-box">
                    <div className="file-icon-circle">
                      <FileText size={32} />
                    </div>
                    <div className="file-info">
                      <span className="file-name">{resumeFile.name}</span>
                      <span className="file-size">{formatFileSize(resumeFile.size)} • PDF</span>
                    </div>
                    <button
                      type="button"
                      className="btn-remove-file"
                      onClick={(e) => {
                        e.stopPropagation();
                        setResumeFile(null);
                      }}
                      title="Remove file"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="dropzone-empty">
                    <div className="upload-icon-circle">
                      <Upload size={28} />
                    </div>
                    <div className="dropzone-text">
                      <strong>Click to browse</strong> or drag & drop your resume PDF
                    </div>
                    <span className="dropzone-hint">PDF format only, maximum 5MB</span>
                  </div>
                )}
              </div>

              {fileError && (
                <div className="inline-error">
                  <AlertCircle size={16} />
                  <span>{fileError}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="textarea-container">
              <textarea
                className="custom-textarea"
                rows={12}
                placeholder="Paste your resume text here (education, skills, projects, work experience)..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
              <div className="textarea-footer">
                <span className="char-counter">
                  {resumeText.trim().length > 0
                    ? `${resumeText.trim().length} characters`
                    : "Min ~50 characters recommended"}
                </span>
                {resumeText.trim().length >= 50 && (
                  <span className="valid-tag">
                    <CheckCircle2 size={14} /> Resume ready
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Job Description */}
        <section className="input-card">
          <div className="card-header-row">
            <div className="card-title-group">
              <Briefcase size={20} className="card-title-icon" />
              <h2>Target Job Description</h2>
            </div>
            <span
              className={`char-counter-badge ${
                jdCharCount === 0
                  ? "counter-muted"
                  : isJdValid
                  ? "counter-valid"
                  : "counter-invalid"
              }`}
            >
              {jdCharCount} / 8000 chars {jdCharCount > 0 && !isJdValid && (jdCharCount < 100 ? "(Min 100)" : "(Max 8000)")}
            </span>
          </div>

          <div className="textarea-container">
            <textarea
              className="custom-textarea"
              rows={12}
              placeholder="Paste the target job description (role overview, responsibilities, requirements, tech stack)..."
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
            <div className="textarea-footer">
              <span className="textarea-hint">
                Required for JD-specific analysis & tailored mock interview questions.
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Action CTA Buttons */}
      <div className="input-cta-row">
        <button
          type="button"
          className="btn-primary btn-cta"
          disabled={!canAnalyze}
          onClick={onAnalyze}
        >
          <Sparkles size={18} />
          <span>{loading ? "Analyzing…" : "Analyze Against This JD"}</span>
          <ArrowRight size={16} />
        </button>

        <button
          type="button"
          className="btn-secondary btn-cta"
          disabled={!canMatchJobs}
          onClick={onMatchJobs}
        >
          <Briefcase size={18} />
          <span>{loading ? "Matching…" : "Find Matching Jobs in India"}</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {(!hasResume || !isJdValid) && (
        <div className="input-hints-row">
          {!hasResume && (
            <span className="hint-pill">
              <AlertCircle size={13} /> Add resume (PDF or paste text)
            </span>
          )}
          {!isJdValid && (
            <span className="hint-pill">
              <AlertCircle size={13} /> Paste JD (100–8000 chars) for full analysis
            </span>
          )}
        </div>
      )}
    </div>
  );
}
