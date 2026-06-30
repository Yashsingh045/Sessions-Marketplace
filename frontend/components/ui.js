"use client";

export function Loading({ label = "Loading…" }) {
  return (
    <div className="loading">
      <span className="spinner" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function ErrorMessage({ children }) {
  return (
    <div className="alert error" role="alert">
      {children}
    </div>
  );
}

export function Notice({ type = "ok", children }) {
  return <div className={`alert ${type}`}>{children}</div>;
}

export function EmptyState({ title, children }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}
