import React from "react";
import { Sparkles, Sun, Moon } from "./Icons";
import { USE_MOCK } from "../api";

export default function Header({ currentView, setView, isDark, toggleTheme, hasAnalysis, hasJobs }) {
  const steps = [
    { key: "input", label: "1. Input", enabled: true },
    { key: "jobs", label: "2. Jobs", enabled: hasJobs },
    { key: "results", label: "3. Results", enabled: hasAnalysis },
    { key: "interview", label: "4. Interview", enabled: hasAnalysis },
    { key: "scorecard", label: "5. Scorecard", enabled: false },
  ];

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="brand-logo"
          onClick={() => setView("input")}
          title="Go to home / input"
        >
          <div className="logo-badge">
            <Sparkles size={20} className="logo-icon" />
          </div>
          <span className="brand-name">
            Resume<span className="brand-highlight">Coach</span>
          </span>
        </button>

        {/* Live AI / Mock Mode Badge */}
        <div className={`mode-badge ${USE_MOCK ? "mode-mock" : "mode-live"}`}>
          <span className="mode-dot" />
          <span className="mode-label">{USE_MOCK ? "Mock Data" : "Live AI"}</span>
        </div>
      </div>

      <nav className="header-breadcrumbs" aria-label="Step progress">
        {steps.map((step) => {
          const isActive = currentView === step.key;
          const isClickable = step.enabled && (step.key !== "scorecard" || currentView === "scorecard");
          return (
            <button
              key={step.key}
              type="button"
              className={`breadcrumb-item ${isActive ? "active" : ""} ${isClickable ? "clickable" : "disabled"}`}
              onClick={() => {
                if (isClickable) setView(step.key);
              }}
              disabled={!isClickable}
            >
              {step.label}
            </button>
          );
        })}
      </nav>

      <div className="header-right">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
