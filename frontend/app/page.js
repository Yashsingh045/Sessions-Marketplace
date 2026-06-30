"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import SessionCard from "../components/SessionCard";
import { EmptyState, ErrorMessage, Loading } from "../components/ui";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth-context";

export default function HomePage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    apiFetch("/sessions/", { auth: false })
      .then((data) => active && setSessions(data))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? sessions.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.description || "").toLowerCase().includes(q)
      )
    : sessions;

  return (
    <div className="container">
      <section className="hero">
        <h1>Find your next live session</h1>
        <p className="muted">Learn from creators. Book a seat in seconds.</p>
        <input
          className="search"
          placeholder="Search sessions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </section>

      {!authLoading && !isAuthenticated && (
        <div className="cta-banner">
          <span>Sign in to book sessions and track your bookings.</span>
          <Link href="/login" className="btn primary sm">
            Sign in with GitHub
          </Link>
        </div>
      )}

      {loading ? (
        <Loading label="Loading catalog…" />
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : filtered.length === 0 ? (
        <EmptyState title="No sessions found">
          {q ? "Try a different search." : "Check back soon for new sessions."}
        </EmptyState>
      ) : (
        <div className="grid">
          {filtered.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      )}
    </div>
  );
}
