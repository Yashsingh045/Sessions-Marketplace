"use client";

import Link from "next/link";

import { useAuth } from "../lib/auth-context";

export default function Navbar() {
  const { isAuthenticated, isCreator, user, logout, loading } = useAuth();

  return (
    <header className="nav">
      <div className="nav-inner container">
        <Link href="/" className="brand">
          ◆ Sessions
        </Link>
        <nav className="nav-links">
          <Link href="/">Catalog</Link>
          {isAuthenticated && <Link href="/dashboard">My Bookings</Link>}
          {isCreator && <Link href="/creator">Creator</Link>}
          {isAuthenticated ? (
            <>
              <Link href="/profile" className="nav-user">
                {user?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt="" className="avatar-sm" />
                ) : null}
                <span className="nav-user-name">{user?.name || user?.username}</span>
                <span className="badge">{user?.role}</span>
              </Link>
              <button className="btn ghost sm" onClick={logout}>
                Sign out
              </button>
            </>
          ) : (
            !loading && (
              <Link href="/login" className="btn primary sm">
                Sign in
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
