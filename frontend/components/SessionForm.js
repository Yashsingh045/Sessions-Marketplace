"use client";

import { useState } from "react";

import { ErrorMessage } from "./ui";

// Convert an ISO timestamp into the value a <input type="datetime-local"> wants
// (local time, no timezone suffix).
function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function SessionForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
  error,
}) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    datetime: toLocalInput(initial?.datetime),
    price: initial?.price ?? "0",
    capacity: initial?.capacity ?? 10,
  });

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      datetime: new Date(form.datetime).toISOString(),
      price: form.price,
      capacity: Number(form.capacity),
    });
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <label>
        Title
        <input required value={form.title} onChange={set("title")} />
      </label>
      <label>
        Description
        <textarea rows={3} value={form.description} onChange={set("description")} />
      </label>
      <div className="grid-2">
        <label>
          Date &amp; time
          <input
            type="datetime-local"
            required
            value={form.datetime}
            onChange={set("datetime")}
          />
        </label>
        <label>
          Capacity
          <input
            type="number"
            min="1"
            required
            value={form.capacity}
            onChange={set("capacity")}
          />
        </label>
      </div>
      <label>
        Price (₹, 0 = free)
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={set("price")}
        />
      </label>
      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn primary" disabled={submitting}>
          {submitting ? "Saving…" : "Save session"}
        </button>
      </div>
    </form>
  );
}
