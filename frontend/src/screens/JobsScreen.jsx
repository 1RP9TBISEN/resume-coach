import React from "react";
import { Briefcase, ArrowLeft, ArrowRight, ExternalLink, Sparkles, Check, AlertCircle } from "../components/Icons";

export default function JobsScreen({ roles = [], onSelectRoleForAnalysis, onBack, loading }) {
  const formatSlug = (str = "") => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  return (
    <div className="screen-container fade-in">
      <div className="screen-header-row">
        <div>
          <button type="button" className="btn-back" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back to Input</span>
          </button>
          <h1 className="screen-title" style={{ marginTop: "12px" }}>
            Top Matched Roles in India
          </h1>
          <p className="screen-subtitle">
            Based on your resume skills and background, here are the highest-fit job titles and sample job descriptions.
          </p>
        </div>
      </div>

      {roles.length === 0 ? (
        <div className="empty-state-card">
          <Briefcase size={40} className="empty-icon" />
          <h3>No matching roles found</h3>
          <p>Try providing more detailed skills, projects, or experience in your resume.</p>
          <button type="button" className="btn-secondary" onClick={onBack}>
            Back to Resume Input
          </button>
        </div>
      ) : (
        <div className="jobs-list">
          {roles.map((role, idx) => {
            const query = role.search_query || role.title;
            const slug = formatSlug(query);
            const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=India`;
            const naukriUrl = `https://www.naukri.com/${slug}-jobs`;
            const internshalaUrl = `https://internshala.com/internships/keywords-${slug}`;

            const fitScore = Math.round(role.fit_score || 0);
            let scoreClass = "score-pill-high";
            if (fitScore < 70) scoreClass = "score-pill-low";
            else if (fitScore < 85) scoreClass = "score-pill-med";

            return (
              <div key={idx} className="job-card">
                <div className="job-card-header">
                  <div className="job-title-group">
                    <div className="job-title-row">
                      <h3 className="job-role-title">{role.title}</h3>
                      <span className={`level-badge level-${role.level || "intern"}`}>
                        {role.level ? role.level.toUpperCase() : "INTERN"}
                      </span>
                    </div>
                    <p className="job-why-text">{role.why}</p>
                  </div>

                  <div className={`fit-score-pill ${scoreClass}`}>
                    <span className="fit-score-number">{fitScore}%</span>
                    <span className="fit-score-label">Fit Match</span>
                  </div>
                </div>

                {/* Skills Grid */}
                <div className="job-skills-section">
                  {role.matched_skills && role.matched_skills.length > 0 && (
                    <div className="skills-group">
                      <span className="skills-group-label">
                        <Check size={13} className="text-success" /> Matched Skills ({role.matched_skills.length})
                      </span>
                      <div className="skill-chips-row">
                        {role.matched_skills.map((skill, sIdx) => (
                          <span key={sIdx} className="skill-chip matched-chip">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {role.missing_skills && role.missing_skills.length > 0 && (
                    <div className="skills-group">
                      <span className="skills-group-label">
                        <AlertCircle size={13} className="text-danger" /> Skill Gaps ({role.missing_skills.length})
                      </span>
                      <div className="skill-chips-row">
                        {role.missing_skills.map((skill, sIdx) => (
                          <span key={sIdx} className="skill-chip missing-chip">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="job-card-footer">
                  <div className="openings-links-group">
                    <span className="openings-label">Live Openings in India:</span>
                    <a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="external-job-link linkedin-link"
                    >
                      LinkedIn <ExternalLink size={12} />
                    </a>
                    <a
                      href={naukriUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="external-job-link naukri-link"
                    >
                      Naukri <ExternalLink size={12} />
                    </a>
                    <a
                      href={internshalaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="external-job-link internshala-link"
                    >
                      Internshala <ExternalLink size={12} />
                    </a>
                  </div>

                  <button
                    type="button"
                    className="btn-primary btn-analyze-role"
                    disabled={loading}
                    onClick={() => onSelectRoleForAnalysis(role)}
                  >
                    <Sparkles size={15} />
                    <span>Analyze for this Role</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
