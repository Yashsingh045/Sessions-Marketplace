"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import Protected from "../../components/Protected";
import SessionForm from "../../components/SessionForm";
import { EmptyState, ErrorMessage, Loading } from "../../components/ui";
import { apiFetch } from "../../lib/api";
import { categoryOf } from "../../lib/category";
import { formatDate, formatPrice } from "../../lib/format";
import { useToast } from "../../lib/toast-context";

function StatCard({ icon, label, value, trend, note }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-ic">{icon}</span>
        {trend && <span className="stat-trend">↑ {trend}</span>}
        {note && <span className="stat-note">{note}</span>}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function CreatorInner() {
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mySessions, myBookings] = await Promise.all([
        apiFetch("/sessions/?mine=1"),
        apiFetch("/creator/bookings/"),
      ]);
      setSessions(mySessions);
      setBookings(myBookings);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (data) => {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) {
        await apiFetch(`/sessions/${editing.id}/`, { method: "PATCH", body: data });
        toast.success("Session updated.");
      } else {
        await apiFetch("/sessions/", { method: "POST", body: data });
        toast.success("Session created.");
      }
      setEditing(null);
      await load();
    } catch (e) {
      setFormError(e.message);
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this session? This cannot be undone.")) return;
    try {
      await apiFetch(`/sessions/${id}/`, { method: "DELETE" });
      setSessions((ss) => ss.filter((s) => s.id !== id));
      if (editing?.id === id) setEditing(null);
      toast.success("Session deleted.");
    } catch (e) {
      toast.error(e.message);
    }
  };

  // Stats from real data.
  const attendees = sessions.reduce((n, s) => n + (s.booked_count || 0), 0);
  const earnings = sessions.reduce(
    (n, s) => n + Number(s.price) * (s.booked_count || 0),
    0
  );

  return (
    <div className="container">
      <div className="dash-top">
        <div>
          <span className="eyebrow">Creator Overview</span>
          <h1>Your Impact Workspace</h1>
        </div>
        <Link href="/profile" className="btn ghost">
          Edit Profile
        </Link>
      </div>

      {loading ? (
        <Loading label="Loading your dashboard…" />
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : (
        <>
          <div className="stats">
            <StatCard
              icon="👥"
              label="Total Attendees"
              value={attendees.toLocaleString()}
            />
            <StatCard
              icon="⭐"
              label="Guide Rating"
              value={
                <>
                  — <small>/ 5.0</small>
                </>
              }
              note="No ratings yet"
            />
            <StatCard
              icon="💳"
              label="Earnings (booked)"
              value={formatPrice(earnings)}
            />
          </div>

          <div className="dash-grid">
            <div className="dash-main">
              <div className="card">
                <div className="panel-head">
                  <h2>Active Sessions</h2>
                  <span className="muted">{sessions.length} total</span>
                </div>
                {sessions.length === 0 ? (
                  <EmptyState title="No sessions yet">
                    Create your first session in the panel on the right.
                  </EmptyState>
                ) : (
                  <div className="list">
                    {sessions.map((s) => (
                      <div key={s.id} className="row">
                        <div className="grow">
                          <div className="bk-top" style={{ marginBottom: "0.3rem" }}>
                            <span className="cat-pill">{categoryOf(s)}</span>
                            <span className="bk-time">{formatPrice(s.price)}</span>
                          </div>
                          <h4 style={{ margin: 0 }}>{s.title}</h4>
                          <div className="sub muted">
                            Next: {formatDate(s.datetime)} · {s.booked_count}/
                            {s.capacity} booked
                          </div>
                        </div>
                        <div className="row-actions">
                          <button
                            className="btn ghost sm"
                            onClick={() => {
                              setEditing(s);
                              setFormError(null);
                              if (typeof window !== "undefined")
                                window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn danger sm"
                            onClick={() => remove(s.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card" style={{ marginTop: "1.25rem" }}>
                <div className="panel-head">
                  <h2>Upcoming Bookings</h2>
                  <span className="muted">{bookings.length} total</span>
                </div>
                {bookings.length === 0 ? (
                  <p className="muted">No one has booked yet.</p>
                ) : (
                  <div className="list">
                    {bookings.map((b) => (
                      <div key={b.id} className="row">
                        <div className="grow">
                          <h4 style={{ margin: 0 }}>
                            {b.user_name || b.user_username}
                          </h4>
                          <div className="sub muted">{b.session_title}</div>
                        </div>
                        <span className={`pill ${b.is_past ? "muted-pill" : "ok"}`}>
                          {formatDate(b.session_datetime)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <aside className="dash-side">
              <div className="card create-panel">
                <h2>{editing ? "Edit Session" : "Create Session"}</h2>
                <p className="muted" style={{ marginTop: "-0.2rem" }}>
                  {editing
                    ? "Update your sanctuary experience."
                    : "Draft a new sanctuary experience."}
                </p>
                <SessionForm
                  key={editing ? editing.id : "new"}
                  initial={editing}
                  onSubmit={submit}
                  onCancel={() => setEditing(null)}
                  submitting={submitting}
                  error={formError}
                />
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

export default function CreatorPage() {
  return (
    <Protected role="CREATOR">
      <CreatorInner />
    </Protected>
  );
}
