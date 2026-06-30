"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { ErrorMessage, Loading } from "../../../components/ui";
import { apiFetch } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import { formatDate, formatPrice } from "../../../lib/format";
import { useToast } from "../../../lib/toast-context";

export default function SessionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch(`/sessions/${id}/`, { auth: false })
      .then(setSession)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => load(), [load]);

  const book = async () => {
    setBooking(true);
    try {
      await apiFetch("/bookings/", {
        method: "POST",
        body: { session: Number(id) },
      });
      toast.success("Booked! Find it under My Bookings.");
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBooking(false);
    }
  };

  if (loading)
    return (
      <div className="container narrow">
        <Loading label="Loading session…" />
      </div>
    );
  if (error)
    return (
      <div className="container narrow">
        <ErrorMessage>{error}</ErrorMessage>
      </div>
    );
  if (!session) return null;

  const full = session.seats_left <= 0;

  return (
    <div className="container narrow">
      <button className="link-back" onClick={() => router.push("/")}>
        ← Back to catalog
      </button>
      <div className="detail card">
        <h1>{session.title}</h1>
        <div className="meta">
          <span>🗓 {formatDate(session.datetime)}</span>
          <span>👤 {session.creator_name || session.creator_username}</span>
          <span className={`pill ${full ? "danger" : "ok"}`}>
            {full
              ? "Sold out"
              : `${session.seats_left} / ${session.capacity} seats left`}
          </span>
        </div>
        <p className="desc">
          {session.description || "No description provided."}
        </p>
        <div className="detail-foot">
          <span className="price big">{formatPrice(session.price)}</span>
          {isAuthenticated ? (
            <button
              className="btn primary"
              disabled={full || booking}
              onClick={book}
            >
              {booking ? "Booking…" : full ? "Sold out" : "Book Now"}
            </button>
          ) : (
            <button
              className="btn primary"
              onClick={() => router.push("/login")}
            >
              Sign in to book
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
