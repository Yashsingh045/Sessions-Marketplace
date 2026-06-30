"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import Protected from "../../components/Protected";
import { EmptyState, ErrorMessage, Loading } from "../../components/ui";
import { apiFetch } from "../../lib/api";
import { formatDate, formatPrice } from "../../lib/format";

function BookingRow({ booking, onCancel, cancelling }) {
  const s = booking.session_detail;
  return (
    <div className="row card">
      <div>
        <Link href={`/sessions/${s.id}`}>
          <h3>{s.title}</h3>
        </Link>
        <div className="meta">
          <span>🗓 {formatDate(s.datetime)}</span>
          <span>{formatPrice(s.price)}</span>
        </div>
      </div>
      <div className="row-actions">
        <span className={`pill ${booking.is_past ? "muted-pill" : "ok"}`}>
          {booking.is_past ? "Past" : "Upcoming"}
        </span>
        {!booking.is_past && (
          <button
            className="btn ghost sm"
            disabled={cancelling}
            onClick={() => onCancel(booking.id)}
          >
            {cancelling ? "Cancelling…" : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );
}

function DashboardInner() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    let active = true;
    apiFetch("/bookings/")
      .then((d) => active && setBookings(d))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const cancel = async (bookingId) => {
    setCancellingId(bookingId);
    try {
      await apiFetch(`/bookings/${bookingId}/`, { method: "DELETE" });
      setBookings((bs) => bs.filter((b) => b.id !== bookingId));
    } catch (e) {
      setError(e.message);
    } finally {
      setCancellingId(null);
    }
  };

  const upcoming = bookings.filter((b) => !b.is_past);
  const past = bookings.filter((b) => b.is_past);

  return (
    <div className="container">
      <h1>My Bookings</h1>
      {loading ? (
        <Loading label="Loading your bookings…" />
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : bookings.length === 0 ? (
        <EmptyState title="No bookings yet">
          <Link href="/">Browse the catalog</Link> to book your first session.
        </EmptyState>
      ) : (
        <>
          <h2 className="section-title">Upcoming ({upcoming.length})</h2>
          {upcoming.length ? (
            <div className="list">
              {upcoming.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  onCancel={cancel}
                  cancelling={cancellingId === b.id}
                />
              ))}
            </div>
          ) : (
            <p className="muted">Nothing upcoming.</p>
          )}

          <h2 className="section-title">Past ({past.length})</h2>
          {past.length ? (
            <div className="list">
              {past.map((b) => (
                <BookingRow key={b.id} booking={b} onCancel={cancel} />
              ))}
            </div>
          ) : (
            <p className="muted">No past sessions.</p>
          )}
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Protected>
      <DashboardInner />
    </Protected>
  );
}
