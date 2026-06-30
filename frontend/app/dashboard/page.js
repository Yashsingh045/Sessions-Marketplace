"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import Protected from "../../components/Protected";
import { EmptyState, ErrorMessage, Loading } from "../../components/ui";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { formatDate, formatPrice } from "../../lib/format";
import { useToast } from "../../lib/toast-context";

function ProfileSection({ user }) {
  const initial = (user?.name || user?.username || "?")[0].toUpperCase();
  return (
    <div className="card profile-summary">
      <div className="who">
        {user?.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt="" className="avatar-lg" />
        ) : (
          <div className="avatar-lg placeholder">{initial}</div>
        )}
        <div>
          <h2>{user?.name || user?.username}</h2>
          <p className="muted">{user?.email || "No email on file"}</p>
          <span className="badge">{user?.role}</span>
        </div>
      </div>
      <Link href="/profile" className="btn ghost sm">
        Edit profile
      </Link>
    </div>
  );
}

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
  const { user } = useAuth();
  const toast = useToast();
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
      toast.success("Booking cancelled.");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCancellingId(null);
    }
  };

  const upcoming = bookings.filter((b) => !b.is_past);
  const past = bookings.filter((b) => b.is_past);

  return (
    <div className="container">
      <h1>My Dashboard</h1>

      <ProfileSection user={user} />

      <h2 className="section-title">My Bookings</h2>
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
          <h3 className="section-title">Upcoming ({upcoming.length})</h3>
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

          <h3 className="section-title">Past ({past.length})</h3>
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
