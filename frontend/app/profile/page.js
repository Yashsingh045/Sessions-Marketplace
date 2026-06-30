"use client";

import { useEffect, useState } from "react";

import Protected from "../../components/Protected";
import { Loading } from "../../components/ui";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { useToast } from "../../lib/toast-context";

function ProfileInner() {
  const { user, applyUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", avatar: "", role: "USER" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        avatar: user.avatar || "",
        role: user.role,
      });
    }
  }, [user]);

  const onAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append("avatar", file);
      const updated = await apiFetch("/me/avatar/", {
        method: "POST",
        body: data,
      });
      applyUser(updated);
      setForm((f) => ({ ...f, avatar: updated.avatar || "" }));
      toast.success("Avatar uploaded.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await apiFetch("/me/", { method: "PATCH", body: form });
      applyUser(updated); // syncs user + role (e.g. USER → CREATOR)
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err.message);
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
            <div style={{ marginTop: "0.6rem" }}>
              <label className="btn ghost sm" style={{ cursor: "pointer" }}>
                {uploading ? "Uploading…" : "Upload avatar"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  hidden
                  disabled={uploading}
                  onChange={onAvatarFile}
                />
              </label>
            </div>
          </div>
        </div>

        <form className="form" onSubmit={save}>
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
