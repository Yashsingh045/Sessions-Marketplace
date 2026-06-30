"use client";

import { useState } from "react";

import { ErrorMessage } from "../../components/ui";
import { apiFetch } from "../../lib/api";

export default function LoginPage() {
  const [redirecting, setRedirecting] = useState(null);
  const [error, setError] = useState(null);

  const start = async (role) => {
    setRedirecting(role);
    setError(null);
    try {
      const { authorize_url } = await apiFetch(
        `/auth/github/login/?role=${role}`,
        { auth: false }
      );
      window.location.href = authorize_url;
    } catch (e) {
      setError(e.message);
      setRedirecting(null);
    }
  };

  return (
    <div className="container narrow center-card">
      <div className="card auth-card">
        <h1>Welcome to Sessions</h1>
        <p className="muted">
          Sign in with GitHub. Pick how you want to start — you can switch
          anytime from your profile.
        </p>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <button
          className="btn github"
          disabled={!!redirecting}
          onClick={() => start("USER")}
        >
          {redirecting === "USER"
            ? "Redirecting…"
            : "Continue as User — book sessions"}
        </button>
        <button
          className="btn github outline"
          disabled={!!redirecting}
          onClick={() => start("CREATOR")}
        >
          {redirecting === "CREATOR"
            ? "Redirecting…"
            : "Continue as Creator — host sessions"}
        </button>
      </div>
    </div>
  );
}
