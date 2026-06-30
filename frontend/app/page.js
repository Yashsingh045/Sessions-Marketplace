"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import SessionCard from "../components/SessionCard";
import { EmptyState, ErrorMessage, Loading } from "../components/ui";
import { apiFetch } from "../lib/api";
import { categoriesFrom, categoryOf } from "../lib/category";
import { useBookedSessionIds } from "../lib/use-booked";

export default function HomePage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const bookedIds = useBookedSessionIds();

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

  // Tags come from the actual sessions, so they always match what's bookable.
  const chips = useMemo(() => categoriesFrom(sessions), [sessions]);

  const q = query.trim().toLowerCase();
  const filtered = sessions.filter((s) => {
    const matchesText =
      !q ||
      s.title.toLowerCase().includes(q) ||
      (s.description || "").toLowerCase().includes(q);
    const matchesCategory =
      !activeCategory || categoryOf(s) === activeCategory;
    return matchesText && matchesCategory;
  });

  const toggleChip = (chip) =>
    setActiveCategory((prev) => (prev === chip ? null : chip));

  // Home features a curated subset; the full list lives on /catalog.
  const featured = filtered.slice(0, 6);

  return (
    <div>
      <section className="hero-wrap container">
        <div className="hero-card">
          <h1>Discover Your Digital Sanctuary</h1>
          <p className="hero-sub">
            Explore curated spiritual sessions, from guided meditations to
            immersive sound baths, designed to elevate your consciousness.
          </p>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sessions, creators, or topics..."
              aria-label="Search sessions"
            />
          </div>
          {chips.length > 0 && (
            <div className="chips">
              {chips.map((chip) => (
                <button
                  key={chip}
                  className={"chip" + (activeCategory === chip ? " active" : "")}
                  onClick={() => toggleChip(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="container featured">
        <div className="featured-head">
          <div>
            <h2>Featured Sessions</h2>
            <p className="muted">Curated experiences for your journey.</p>
          </div>
          <Link className="view-all" href="/catalog">
            View All →
          </Link>
        </div>

        {loading ? (
          <Loading label="Loading sessions…" />
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : featured.length === 0 ? (
          <EmptyState title="No sessions found">
            {q ? "Try a different search." : "Check back soon for new sessions."}
          </EmptyState>
        ) : (
          <div className="grid">
            {featured.map((s) => (
              <SessionCard key={s.id} session={s} booked={bookedIds.has(s.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
