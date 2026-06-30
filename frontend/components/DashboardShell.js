"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "../lib/auth-context";

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function SessionsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="7" r="3.2" />
      <path d="M5 21v-1.5a7 7 0 0 1 14 0V21" />
    </svg>
  );
}
function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// App-shell with the left sidebar used by the user + creator dashboards
// (matches the mockup; the global top navbar/footer are hidden on these routes).
export default function DashboardShell({ children }) {
  const { isCreator, logout } = useAuth();
  const pathname = usePathname();
  const onDashboard = pathname === "/dashboard";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        {/* Brand lives in the global top navbar now; sidebar starts with nav. */}
        <nav className="sidebar-nav" style={{ display: "contents" }}>
          {/* Creators host sessions from the dashboard; users browse to book. */}
          <Link
            href={isCreator ? "/dashboard" : "/catalog"}
            className="side-cta"
          >
            + New Session
          </Link>
          <Link
            href="/dashboard"
            className={"side-item" + (onDashboard ? " active" : "")}
          >
            <GridIcon /> Dashboard
          </Link>
          <Link href="/catalog" className="side-item">
            <SessionsIcon /> Explore Sessions
          </Link>
        </nav>

        <button className="side-signout" onClick={logout}>
          <SignOutIcon /> Sign Out
        </button>
      </aside>

      <div className="app-main">{children}</div>
    </div>
  );
}
