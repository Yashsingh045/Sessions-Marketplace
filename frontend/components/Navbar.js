"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "../lib/auth-context";

export default function Navbar() {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const pathname = usePathname();

  const linkClass = (href) =>
    "nav-link" + (pathname === href ? " active" : "");

  const initial = (user?.name || user?.username || "?")[0]?.toUpperCase();

  return (
    <header className="nav">
      <div className="nav-inner container">
        <Link href="/" className="brand">
          Ahoum
        </Link>
        <nav className="nav-links">
          <Link href="/" className={linkClass("/")}>
            Home
          </Link>
          <Link href="/catalog" className={linkClass("/catalog")}>
            Catalog
          </Link>
          {isAuthenticated && (
            <Link href="/dashboard" className={linkClass("/dashboard")}>
              Dashboard
            </Link>
          )}
          {isAuthenticated ? (
            <>
              <Link href="/profile" className="nav-user">
                {user?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt="" className="avatar-sm" />
                ) : (
                  <span className="avatar-xs">{initial}</span>
                )}
                <span className="nav-user-name">
                  {user?.name || user?.username}
                </span>
              </Link>
              <button className="btn ghost sm" onClick={logout}>
                Sign out
              </button>
            </>
          ) : (
            !loading && (
              <Link href="/login" className="sign-in">
                Sign In
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
