"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { apiFetch, setAuthFailureHandler, tokenStore } from "./api";
import { decodeJwt } from "./jwt";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Set both user and the role that drives route protection / nav.
  const applyUser = useCallback((u) => {
    setUser(u);
    setRole(u ? u.role : null);
  }, []);

  // On first load, hydrate from a stored token by asking the API who we are.
  // /me also exercises the refresh path if the access token is stale.
  useEffect(() => {
    setAuthFailureHandler(() => applyUser(null));
    let active = true;
    (async () => {
      if (!tokenStore.access) {
        setLoading(false);
        return;
      }
      // Optimistic role from the token claim for instant nav rendering.
      const decoded = decodeJwt(tokenStore.access);
      if (decoded?.role) setRole(decoded.role);
      try {
        const me = await apiFetch("/me/");
        if (active) applyUser(me);
      } catch {
        tokenStore.clear();
        if (active) applyUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [applyUser]);

  const login = useCallback(
    async (access, refresh) => {
      tokenStore.set(access, refresh);
      const decoded = decodeJwt(access);
      if (decoded?.role) setRole(decoded.role);
      const me = await apiFetch("/me/");
      applyUser(me);
      return me;
    },
    [applyUser]
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    applyUser(null);
    router.push("/login");
  }, [applyUser, router]);

  const refreshProfile = useCallback(async () => {
    const me = await apiFetch("/me/");
    applyUser(me);
    return me;
  }, [applyUser]);

  const value = {
    user,
    role,
    loading,
    isAuthenticated: !!user,
    isCreator: role === "CREATOR",
    login,
    logout,
    refreshProfile,
    applyUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
