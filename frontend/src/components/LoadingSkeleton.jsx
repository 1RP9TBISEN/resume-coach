import React from "react";

export function SkeletonBox({ width = "100%", height = "20px", borderRadius = "8px", style = {}, className = "" }) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

export function ResultsSkeleton() {
  return (
    <div className="skeleton-container fade-in">
      <div className="skeleton-hero-card">
        <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap", justifyContent: "center" }}>
          <SkeletonBox width="160px" height="160px" borderRadius="50%" />
          <div style={{ flex: "1", minWidth: "260px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <SkeletonBox width="60%" height="28px" />
            <SkeletonBox width="90%" height="18px" />
            <SkeletonBox width="75%" height="18px" />
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <SkeletonBox width="100px" height="36px" borderRadius="20px" />
              <SkeletonBox width="100px" height="36px" borderRadius="20px" />
            </div>
          </div>
        </div>
      </div>

      <div className="skeleton-section" style={{ marginTop: "24px" }}>
        <SkeletonBox width="200px" height="24px" style={{ marginBottom: "16px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-card" style={{ padding: "16px" }}>
              <SkeletonBox width="50%" height="16px" style={{ marginBottom: "10px" }} />
              <SkeletonBox width="100%" height="10px" borderRadius="6px" />
            </div>
          ))}
        </div>
      </div>

      <div className="skeleton-section" style={{ marginTop: "24px" }}>
        <SkeletonBox width="160px" height="24px" style={{ marginBottom: "16px" }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <SkeletonBox key={i} width="120px" height="34px" borderRadius="20px" />
          ))}
        </div>
      </div>

      <div className="skeleton-section" style={{ marginTop: "24px" }}>
        <SkeletonBox width="180px" height="24px" style={{ marginBottom: "16px" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card" style={{ padding: "16px" }}>
              <SkeletonBox width="40%" height="20px" style={{ marginBottom: "8px" }} />
              <SkeletonBox width="90%" height="16px" style={{ marginBottom: "6px" }} />
              <SkeletonBox width="70%" height="16px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function JobsSkeleton() {
  return (
    <div className="skeleton-container fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <SkeletonBox width="220px" height="32px" />
        <SkeletonBox width="120px" height="36px" borderRadius="8px" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <SkeletonBox width="200px" height="24px" />
                <SkeletonBox width="70px" height="22px" borderRadius="12px" />
              </div>
              <SkeletonBox width="80px" height="32px" borderRadius="16px" />
            </div>
            <SkeletonBox width="85%" height="16px" style={{ marginBottom: "16px" }} />
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              <SkeletonBox width="80px" height="24px" borderRadius="12px" />
              <SkeletonBox width="90px" height="24px" borderRadius="12px" />
              <SkeletonBox width="70px" height="24px" borderRadius="12px" />
              <SkeletonBox width="85px" height="24px" borderRadius="12px" />
            </div>
            <div style={{ display: "flex", gap: "12px", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
              <SkeletonBox width="140px" height="36px" borderRadius="8px" />
              <SkeletonBox width="100px" height="36px" borderRadius="8px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeedbackSkeleton() {
  return (
    <div className="skeleton-feedback fade-in" style={{ padding: "16px", borderRadius: "12px", border: "1px solid var(--border)", marginTop: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <SkeletonBox width="64px" height="32px" borderRadius="16px" />
        <SkeletonBox width="180px" height="20px" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <SkeletonBox width="90%" height="16px" />
        <SkeletonBox width="80%" height="16px" />
        <SkeletonBox width="85%" height="16px" />
      </div>
      <SkeletonBox width="100%" height="60px" borderRadius="8px" style={{ marginTop: "14px" }} />
    </div>
  );
}
