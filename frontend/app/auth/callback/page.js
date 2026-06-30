"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ErrorMessage, Loading } from "../../../components/ui";
import { useAuth } from "../../../lib/auth-context";

// The backend OAuth callback redirects here with tokens in the URL fragment:
//   /auth/callback#access=...&refresh=...&role=...
// We read them (fragments never reach a server), store them, and route by role.
export default function AuthCallbackPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const hash =
      typeof window !== "undefined"
        ? window.location.hash.replace(/^#/, "")
        : "";
    const params = new URLSearchParams(hash);
    const access = params.get("access");
    const refresh = params.get("refresh");

    if (!access || !refresh) {
      setError("Sign-in failed or was cancelled. Please try again.");
      return;
    }

    // Strip tokens from the visible URL.
    window.history.replaceState({}, "", "/auth/callback");

    login(access, refresh)
      .then((me) =>
        router.replace(me.role === "CREATOR" ? "/creator" : "/dashboard")
      )
      .catch(() => setError("Could not complete sign-in. Please try again."));
  }, [login, router]);

  return (
    <div className="container narrow center-card">
      {error ? (
        <div className="card auth-card">
          <ErrorMessage>{error}</ErrorMessage>
          <button className="btn primary" onClick={() => router.replace("/login")}>
            Back to sign in
          </button>
        </div>
      ) : (
        <Loading label="Finishing sign-in…" />
      )}
    </div>
  );
}
