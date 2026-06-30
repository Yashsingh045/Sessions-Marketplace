"use client";

import { useEffect, useMemo, useState } from "react";

import SessionCard from "../../components/SessionCard";
import { EmptyState, ErrorMessage, Loading } from "../../components/ui";
import { apiFetch } from "../../lib/api";
import { categoriesFrom, categoryOf } from "../../lib/category";
import { useBookedSessionIds } from "../../lib/use-booked";

export default function CatalogPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState("");
  const [price, setPrice] = useState("all"); // all | free | under500 | 500plus
  const [sort, setSort] = useState("date-asc"); // date-asc|date-desc|price-asc|price-desc
  const [activeCategory, setActiveCategory] = useState(null);
  const bookedIds = useBookedSessionIds();

  const chips = useMemo(() => categoriesFrom(sessions), [sessions]);

  useEffect(() => {
    let active = true;
    apiFetch("/sessions/", { auth: false })
      .then((d) => active && setSessions(d))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = sessions.filter((s) => {
      const matchesText =
        !q ||
        s.title.toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q) ||
        (s.creator_name || "").toLowerCase().includes(q);
      const p = Number(s.price);
      const matchesPrice =
        price === "all" ||
        (price === "free" && p === 0) ||
        (price === "under500" && p > 0 && p < 500) ||
        (price === "500plus" && p >= 500);
      const matchesCategory =
        !activeCategory || categoryOf(s) === activeCategory;
      return matchesText && matchesPrice && matchesCategory;
    });
    const byDate = (a, b) => new Date(a.datetime) - new Date(b.datetime);
    const byPrice = (a, b) => Number(a.price) - Number(b.price);
    list = [...list].sort((a, b) => {
      if (sort === "date-asc") return byDate(a, b);
      if (sort === "date-desc") return byDate(b, a);
      if (sort === "price-asc") return byPrice(a, b);
      if (sort === "price-desc") return byPrice(b, a);
      return 0;
    });
    return list;
  }, [sessions, query, price, sort, activeCategory]);

  return (
    <div className="container">
      <div className="catalog-head">
        <h1>Browse Sessions</h1>
        <p className="muted">
          Every session on Ahoum — search and filter to find your fit.
        </p>
      </div>

      <div className="filters">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sessions, creators, or topics..."
            aria-label="Search sessions"
          />
        </div>
        <select
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          aria-label="Filter by price"
        >
          <option value="all">All prices</option>
          <option value="free">Free</option>
          <option value="under500">Under ₹500</option>
          <option value="500plus">₹500 &amp; up</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort by"
        >
          <option value="date-asc">Date: soonest</option>
          <option value="date-desc">Date: latest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>

      {chips.length > 0 && (
        <div className="chips chips-left">
          <button
            className={"chip" + (activeCategory === null ? " active" : "")}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {chips.map((chip) => (
            <button
              key={chip}
              className={"chip" + (activeCategory === chip ? " active" : "")}
              onClick={() =>
                setActiveCategory((prev) => (prev === chip ? null : chip))
              }
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <Loading label="Loading sessions…" />
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : (
        <>
          <p className="result-count">
            {visible.length} session{visible.length === 1 ? "" : "s"}
          </p>
          {visible.length === 0 ? (
            <EmptyState title="No sessions match">
              Try clearing a filter or searching for something else.
            </EmptyState>
          ) : (
            <div className="grid">
              {visible.map((s) => (
                <SessionCard key={s.id} session={s} booked={bookedIds.has(s.id)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
