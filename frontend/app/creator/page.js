"use client";

import { useEffect, useState } from "react";

import Protected from "../../components/Protected";
import SessionForm from "../../components/SessionForm";
import { EmptyState, ErrorMessage, Loading } from "../../components/ui";
import { apiFetch } from "../../lib/api";
import { formatDate, formatPrice } from "../../lib/format";

function CreatorInner() {
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
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

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setShowForm(true);
  };
  const openEdit = (s) => {
    setEditing(s);
    setFormError(null);
    setShowForm(true);
  };

  const submit = async (data) => {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) {
        await apiFetch(`/sessions/${editing.id}/`, {
          method: "PATCH",
          body: data,
        });
      } else {
        await apiFetch("/sessions/", { method: "POST", body: data });
      }
      setShowForm(false);
      await load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this session? This cannot be undone.")) return;
    try {
      await apiFetch(`/sessions/${id}/`, { method: "DELETE" });
      setSessions((ss) => ss.filter((s) => s.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <h1>Creator Dashboard</h1>
        {!showForm && (
          <button className="btn primary" onClick={openCreate}>
            + New session
          </button>
        )}
      </div>

      {showForm && (
        <div className="card form-card">
          <h2>{editing ? "Edit session" : "Create a session"}</h2>
          <SessionForm
            initial={editing}
            onSubmit={submit}
            onCancel={() => setShowForm(false)}
            submitting={submitting}
            error={formError}
          />
        </div>
      )}

      {loading ? (
        <Loading label="Loading your dashboard…" />
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : (
        <>
          <h2 className="section-title">My sessions ({sessions.length})</h2>
          {sessions.length === 0 ? (
            <EmptyState title="No sessions yet">
              Create your first session to start taking bookings.
            </EmptyState>
          ) : (
            <div className="list">
              {sessions.map((s) => (
                <div key={s.id} className="row card">
                  <div>
                    <h3>{s.title}</h3>
                    <div className="meta">
                      <span>🗓 {formatDate(s.datetime)}</span>
                      <span>{formatPrice(s.price)}</span>
                      <span>
                        {s.booked_count}/{s.capacity} booked
                      </span>
                    </div>
                  </div>
                  <div className="row-actions">
                    <button className="btn ghost sm" onClick={() => openEdit(s)}>
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

          <h2 className="section-title">
            Bookings on my sessions ({bookings.length})
          </h2>
          {bookings.length === 0 ? (
            <p className="muted">No one has booked yet.</p>
          ) : (
            <div className="table">
              <div className="thead">
                <span>Attendee</span>
                <span>Session</span>
                <span>When</span>
                <span>Status</span>
              </div>
              {bookings.map((b) => (
                <div key={b.id} className="trow">
                  <span>{b.user_name || b.user_username}</span>
                  <span>{b.session_title}</span>
                  <span>{formatDate(b.session_datetime)}</span>
                  <span
                    className={`pill ${b.is_past ? "muted-pill" : "ok"}`}
                  >
                    {b.is_past ? "Past" : "Upcoming"}
                  </span>
                </div>
              ))}
            </div>
          )}
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
