"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../lib/auth-context";
import { Loading } from "./ui";

// Client-side route guard. `role` optionally requires a specific role.
export default function Protected({ children, role }) {
  const { isAuthenticated, loading, role: userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace("/login");
    } else if (role && userRole !== role) {
      router.replace("/");
    }
  }, [loading, isAuthenticated, userRole, role, router]);

  if (loading) return <Loading label="Checking access…" />;
  if (!isAuthenticated) return <Loading label="Redirecting to sign in…" />;
  if (role && userRole !== role) {
    return (
      <div className="container">
        <div className="alert error">
          This page requires a {role.toLowerCase()} account.
        </div>
      </div>
    );
  }
  return children;
}
