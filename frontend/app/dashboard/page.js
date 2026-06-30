"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import Protected from "../../components/Protected";
import { EmptyState, ErrorMessage, Loading } from "../../components/ui";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { categoryOf } from "../../lib/category";
import { formatDate, formatDateShort } from "../../lib/format";
import { useToast } from "../../lib/toast-context";

/* ---- Live countdown to the next upcoming session ---- */
function NextSessionCard({ target }) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    if (!target) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);

  if (!target) return null;
  let label = "--:--:--";
  if (now !== null) {
    let diff = Math.max(0, new Date(target).getTime() - now);
    const h = Math.floor(diff / 3600000);
    diff -= h * 3600000;
    const m = Math.floor(diff / 60000);
    diff -= m * 60000;
    const s = Math.floor(diff / 1000);
    const pad = (n) => String(n).padStart(2, "0");
    label = `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return (
    <div className="next-card">
      <span className="nc-ic">⏳</span>
      <div>
        <div className="nc-label">NEXT SESSION IN</div>
        <div className="nc-time">{label}</div>
      </div>
    </div>
  );
}

/* ---- Editable profile card (all details) ---- */
function ProfileCard() {
  const { user, applyUser } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const [form, setForm] = useState({ name: "", role: "USER" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || "", role: user.role });
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await apiFetch("/me/", { method: "PATCH", body: form });
      applyUser(updated);
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append("avatar", file);
      const updated = await apiFetch("/me/avatar/", { method: "POST", body: data });
      applyUser(updated);
      toast.success("Avatar updated.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;
  const initial = (user.name || user.username || "?")[0].toUpperCase();

  return (
    <div className="card profile-panel">
      <h2>Profile</h2>
      <div className="pe-avatar">
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt="" className="avatar-lg" />
        ) : (
          <div className="avatar-lg placeholder">{initial}</div>
        )}
        <button
          type="button"
          className="btn ghost sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? "Uploading…" : "Change avatar"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          hidden
          onChange={onFile}
        />
      </div>

      <form className="form" onSubmit={save}>
        <label>
          Display Name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          Username
          <input value={user.username} disabled />
        </label>
        <label>
          Email
          <input value={user.email || "—"} disabled />
        </label>
        <label>
          Role
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="USER">User — book sessions</option>
            <option value="CREATOR">Creator — host sessions</option>
          </select>
        </label>
        <div className="form-actions">
          <button className="btn primary" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ActiveCard({ booking, onCancel, cancelling }) {
  const s = booking.session_detail;
  return (
    <div className="bk-card">
      <div className="bk-top">
        <span className="cat-pill">{categoryOf(s)}</span>
        <span className="bk-time">{formatDate(s.datetime)}</span>
      </div>
      <h3>{s.title}</h3>
      <p className="bk-guide">
        👤 Guide: {s.creator_name || s.creator_username}
      </p>
      <div className="bk-actions">
        <Link href={`/sessions/${s.id}`} className="btn ghost sm">
          Details
        </Link>
        <button
          className="btn danger sm"
          disabled={cancelling}
          onClick={() => onCancel(booking.id)}
        >
          {cancelling ? "Cancelling…" : "Cancel"}
        </button>
      </div>
    </div>
  );
}

function DashboardInner() {
  const { user } = useAuth();
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    let active = true;
    apiFetch("/bookings/")
      .then((d) => active && setBookings(d))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const cancel = async (id) => {
    setCancellingId(id);
    try {
      await apiFetch(`/bookings/${id}/`, { method: "DELETE" });
      setBookings((bs) => bs.filter((b) => b.id !== id));
      toast.success("Booking cancelled.");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCancellingId(null);
    }
  };

  const upcoming = bookings.filter((b) => !b.is_past);
  const past = bookings.filter((b) => b.is_past);
  const nextTarget = upcoming
    .map((b) => b.session_detail.datetime)
    .sort((a, b) => new Date(a) - new Date(b))[0];

  return (
    <div className="container">
      <div className="dash-top">
        <div>
          <h1>Welcome back, {user?.name || user?.username}.</h1>
          <p className="muted">Your journey continues today.</p>
        </div>
        {nextTarget && <NextSessionCard target={nextTarget} />}
      </div>

      <div className="dash-grid">
        <div className="dash-main">
          <div className="dash-sec-title">
            <h2>📅 Active Bookings</h2>
          </div>
          {loading ? (
            <Loading label="Loading your bookings…" />
          ) : error ? (
            <ErrorMessage>{error}</ErrorMessage>
          ) : upcoming.length === 0 ? (
            <EmptyState title="No upcoming bookings">
              <Link href="/catalog">Browse the catalog</Link> to book a session.
            </EmptyState>
          ) : (
            <div className="booking-cards">
              {upcoming.map((b) => (
                <ActiveCard
                  key={b.id}
                  booking={b}
                  onCancel={cancel}
                  cancelling={cancellingId === b.id}
                />
              ))}
            </div>
          )}

          <div className="dash-sec-title">
            <h2>🕘 Past Bookings</h2>
          </div>
          {past.length === 0 ? (
            <p className="muted">No past sessions yet.</p>
          ) : (
            <div className="list">
              {past.map((b) => {
                const s = b.session_detail;
                return (
                  <div key={b.id} className="card past-row">
                    <span className="past-ic">🧘</span>
                    <div className="grow">
                      <h4>{s.title}</h4>
                      <div className="sub">
                        {formatDateShort(s.datetime)} · {categoryOf(s)}
                      </div>
                    </div>
                    <Link href={`/sessions/${s.id}`} className="btn ghost sm">
                      Book Again
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <aside className="dash-side">
          <ProfileCard />
        </aside>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Protected>
      <DashboardInner />
    </Protected>
  );
}
