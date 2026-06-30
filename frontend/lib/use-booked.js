"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "./api";
import { useAuth } from "./auth-context";

// Returns a Set of session IDs the current user has already booked (empty when
// signed out). Used to swap "Book Now" for an "Already Booked" badge.
export function useBookedSessionIds() {
  const { isAuthenticated } = useAuth();
  const [ids, setIds] = useState(() => new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      setIds(new Set());
      return;
    }
    let active = true;
    apiFetch("/bookings/")
      .then((bookings) => {
        if (active) setIds(new Set(bookings.map((b) => b.session)));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  return ids;
}
