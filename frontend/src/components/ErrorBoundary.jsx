import React from "react";
import { AlertCircle, RotateCcw } from "./Icons";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  handleStartOver = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-screen fade-in">
          <div className="error-boundary-card">
            <div className="error-boundary-icon-circle">
              <AlertCircle size={36} />
            </div>
            <h2>Something went wrong</h2>
            <p className="error-boundary-desc">
              An unexpected interface error occurred. Don't worry, your progress can be restored.
            </p>
            {this.state.error?.message && (
              <pre className="error-boundary-details">{this.state.error.message}</pre>
            )}
            <button
              type="button"
              className="btn-primary btn-start-over"
              onClick={this.handleStartOver}
            >
              <RotateCcw size={16} />
              <span>Start Over</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
