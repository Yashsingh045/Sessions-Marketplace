"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import SessionForm from "./SessionForm";
import { EmptyState, ErrorMessage, Loading } from "./ui";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { categoryOf } from "../lib/category";
import { formatDate, formatPrice } from "../lib/format";
import { useToast } from "../lib/toast-context";

const THUMBS = [
  "linear-gradient(135deg,#cdbff2,#8a7bd8)",
  "linear-gradient(135deg,#d9d2c4,#a9a08c)",
  "linear-gradient(135deg,#bcd3d8,#7fa6ad)",
  "linear-gradient(135deg,#c8d8c4,#8fb083)",
  "linear-gradient(135deg,#e0cdd6,#b48aa0)",
];

function initials(name) {
  const parts = (name || "?").trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

function StatCard({ icon, label, value, badge }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-ic">{icon}</span>
        {badge}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function CoverArt() {
  const toast = useToast();
  return (
    <div
      className="coverart"
      onClick={() => toast.info("Cover art upload is coming soon.")}
    >
      <div className="coverart-icon">☁️⤴</div>
      <div className="coverart-hint">Drag &amp; drop or click to upload</div>
      <div className="coverart-sub">Supports JPG, PNG (Max 5MB)</div>
    </div>
  );
}

export default function CreatorDashboard() {
  const { user } = useAuth();
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

  const startEdit = (s) => {
    setEditing(s);
    setFormError(null);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const attendees = sessions.reduce((n, s) => n + (s.booked_count || 0), 0);
  const earnings = sessions.reduce(
    (n, s) => n + Number(s.price) * (s.booked_count || 0),
    0
  );

  return (
    <>
      <div className="dash-top">
        <div>
          <span className="eyebrow">Creator Overview</span>
          <h1>Your Impact Workspace</h1>
        </div>
        <Link href="/profile" className="dash-identity" title="Edit profile">
          <span className="ident-name">Edit Profile</span>
          {/* <span className="ident-name">{user?.name || user?.username}</span>
          {user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt="" className="ident-av" />
          ) : (
            <span className="ident-av">{initials(user?.name || user?.username)}</span>
          )} */}

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
              badge={<span className="stat-trend">↑ 12%</span>}
            />
            <StatCard
              icon="⭐"
              label="Guide Rating"
              value={
                <>
                  — <small>/ 5.0</small>
                </>
              }
              badge={<span className="stat-note">Current Avg</span>}
            />
            <StatCard
              icon="💳"
              label="Monthly Earnings"
              value={`₹${earnings.toLocaleString()}`}
            />
          </div>

          <div className="dash-grid">
            <div className="dash-main">
              <div className="card">
                <div className="panel-head">
                  <h2>Active Sessions</h2>
                  <Link href="/catalog" className="view-all">
                    View All
                  </Link>
                </div>
                {sessions.length === 0 ? (
                  <EmptyState title="No sessions yet">
                    Create your first session in the panel on the right.
                  </EmptyState>
                ) : (
                  <div>
                    {sessions.map((s) => (
                      <div key={s.id} className="sess-row">
                        <span
                          className="sess-thumb"
                          style={{ background: THUMBS[s.id % THUMBS.length] }}
                        />
                        <div className="sess-body">
                          <div className="sess-pills">
                            <span className="cat-pill">{categoryOf(s)}</span>
                            <span className="dur-pill">{formatPrice(s.price)}</span>
                          </div>
                          <h4>{s.title}</h4>
                          <div className="sub">
                            Next: {formatDate(s.datetime)} · {s.booked_count}/
                            {s.capacity} booked
                          </div>
                        </div>
                        <div className="sess-actions">
                          <button
                            className="btn ghost sm"
                            onClick={() => startEdit(s)}
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
                  <div>
                    {bookings.map((b) => {
                      const who = b.user_name || b.user_username;
                      return (
                        <div key={b.id} className="book-row">
                          <span className="book-av">{initials(who)}</span>
                          <div className="grow">
                            <h4>{who}</h4>
                            <div className="sub">{b.session_title}</div>
                          </div>
                          <span className="book-when">
                            {formatDate(b.session_datetime)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <aside className="dash-side">
              <div className="card create-panel">
                <h2>{editing ? "Edit Session" : "Create Session"}</h2>
                <p className="muted" style={{ marginTop: "-0.2rem" }}>
                  Draft a new sanctuary experience.
                </p>
                {!editing && <CoverArt />}
                <SessionForm
                  key={editing ? editing.id : "new"}
                  initial={editing}
                  onSubmit={submit}
                  onCancel={() => setEditing(null)}
                  submitting={submitting}
                  error={formError}
                  submitLabel={editing ? "Save changes" : "New Session"}
                  submitClassName="btn violet"
                />
              </div>
            </aside>
          </div>
        </>
      )}
    </>
  );
}
