import React from "react";
import { AlertCircle, RotateCcw, X } from "./Icons";

export default function ErrorBanner({ message, onRetry, onDismiss }) {
  if (!message) return null;

  return (
    <div className="error-banner fade-in" role="alert">
      <div className="error-banner-content">
        <AlertCircle size={20} className="error-icon" />
        <div className="error-message-text">{message}</div>
      </div>
      <div className="error-banner-actions">
        {onRetry && (
          <button type="button" className="btn-retry" onClick={onRetry}>
            <RotateCcw size={14} />
            <span>Retry</span>
          </button>
        )}
        {onDismiss && (
          <button type="button" className="btn-dismiss" onClick={onDismiss} aria-label="Dismiss error">
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
