"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { ErrorMessage, Loading } from "../../../components/ui";
import { apiFetch } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import { formatDate, formatPrice } from "../../../lib/format";
import { loadRazorpay } from "../../../lib/razorpay";
import { useToast } from "../../../lib/toast-context";

export default function SessionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
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

  // Free sessions: book directly. Paid sessions: Razorpay order → checkout → verify.
  const book = async () => {
    setBooking(true);
    try {
      if (Number(session.price) <= 0) {
        await apiFetch("/bookings/", {
          method: "POST",
          body: { session: Number(id) },
        });
        toast.success("Booked! Find it under My Bookings.");
        load();
        return;
      }
      await payAndBook();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBooking(false);
    }
  };

  const payAndBook = async () => {
    const order = await apiFetch("/payments/order/", {
      method: "POST",
      body: { session: Number(id) },
    });

    const ready = await loadRazorpay();
    if (!ready) {
      toast.error("Could not load the payment gateway. Check your connection.");
      return;
    }

    const rzp = new window.Razorpay({
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      name: "Sessions Marketplace",
      description: order.session_title,
      order_id: order.order_id,
      prefill: { name: user?.name || user?.username, email: user?.email || "" },
      theme: { color: "#6366f1" },
      handler: async (resp) => {
        try {
          await apiFetch("/payments/verify/", {
            method: "POST",
            body: {
              session: Number(id),
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            },
          });
          toast.success("Payment successful — booking confirmed!");
          load();
        } catch (e) {
          toast.error(e.message);
        }
      },
      modal: {
        ondismiss: () => toast.info("Payment cancelled."),
      },
    });
    rzp.on("payment.failed", () =>
      toast.error("Payment failed. Please try again.")
    );
    rzp.open();
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
  const paid = Number(session.price) > 0;
  const bookLabel = full
    ? "Sold out"
    : paid
    ? `Pay & Book · ${formatPrice(session.price)}`
    : "Book Now";

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
              {booking ? "Processing…" : bookLabel}
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
        {paid && (
          <p className="muted" style={{ fontSize: "0.8rem", marginTop: "0.75rem" }}>
            Test mode — use Razorpay test card 4111 1111 1111 1111, any future
            expiry & CVV.
          </p>
        )}
      </div>
    </div>
  );
}
