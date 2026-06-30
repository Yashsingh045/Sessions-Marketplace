"use client";

import { useState } from "react";

import { ErrorMessage } from "../../components/ui";
import { apiFetch } from "../../lib/api";

export default function LoginPage() {
  const [role, setRole] = useState("USER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Kick off GitHub OAuth for the chosen role; backend returns the authorize URL.
  const cont = async () => {
    setLoading(true);
    setError(null);
    try {
      const { authorize_url } = await apiFetch(
        `/auth/github/login/?role=${role}`,
        { auth: false }
      );
      window.location.href = authorize_url;
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-split">
      <div className="auth-left">
        <div className="auth-left-content">
          <h1>Welcome to Ahoum SpiritualTech.</h1>
          <p>
            A digital sanctuary where ancient wisdom meets modern precision.
            Connect with world-class creators for personalized spiritual growth
            sessions.
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div className="path-card">
          <div className="path-brand">Ahoum</div>
          <div className="path-sub">Digital Sanctuary</div>
          <h2>Choose Your Path</h2>
          <p className="muted center">
            Select how you want to experience the sanctuary.
          </p>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <div className="path-options">
            <button
              type="button"
              className={"path-option" + (role === "USER" ? " selected" : "")}
              onClick={() => setRole("USER")}
              aria-pressed={role === "USER"}
            >
              <span className="po-icon">👤</span>
              <span className="po-title">User</span>
              <span className="po-desc">Browse &amp; book sessions</span>
            </button>
            <button
              type="button"
              className={"path-option" + (role === "CREATOR" ? " selected" : "")}
              onClick={() => setRole("CREATOR")}
              aria-pressed={role === "CREATOR"}
            >
              <span className="po-icon">✨</span>
              <span className="po-title">Creator</span>
              <span className="po-desc">Create &amp; manage sessions</span>
            </button>
          </div>

          <button
            className="btn primary continue-btn"
            disabled={loading}
            onClick={cont}
          >
            {loading ? "Redirecting…" : "Continue →"}
          </button>

          <div className="path-divider" />
          <div className="jwt-note">🛡 Secured by JWT Authentication</div>
        </div>
      </div>
    </div>
  );
}
