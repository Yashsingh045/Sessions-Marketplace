"use client";

import { useEffect, useState } from "react";

import Protected from "../../components/Protected";
import { ErrorMessage, Loading, Notice } from "../../components/ui";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";

function ProfileInner() {
  const { user, applyUser } = useAuth();
  const [form, setForm] = useState({ name: "", avatar: "", role: "USER" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        avatar: user.avatar || "",
        role: user.role,
      });
    }
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await apiFetch("/me/", { method: "PATCH", body: form });
      applyUser(updated); // syncs user + role (e.g. USER → CREATOR)
      setMessage("Profile updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <Loading />;

  const initial = (user.name || user.username || "?")[0].toUpperCase();

  return (
    <div className="container narrow">
      <h1>Profile</h1>
      <div className="card">
        <div className="profile-head">
          {form.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.avatar} alt="" className="avatar-lg" />
          ) : (
            <div className="avatar-lg placeholder">{initial}</div>
          )}
          <div>
            <h2>{user.username}</h2>
            <p className="muted">{user.email || "No email on file"}</p>
            <span className="badge">{user.role}</span>
          </div>
        </div>

        <form className="form" onSubmit={save}>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {message && <Notice type="ok">{message}</Notice>}
          <label>
            Display name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Avatar URL
            <input
              value={form.avatar}
              placeholder="https://…"
              onChange={(e) => setForm({ ...form, avatar: e.target.value })}
            />
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
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Protected>
      <ProfileInner />
    </Protected>
  );
}
