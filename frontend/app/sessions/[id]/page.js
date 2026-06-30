"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { ErrorMessage, Loading } from "../../../components/ui";
import { apiFetch } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import { categoryOf } from "../../../lib/category";
import { formatDate, formatPrice } from "../../../lib/format";
import { loadRazorpay } from "../../../lib/razorpay";
import { useToast } from "../../../lib/toast-context";

const GRADIENTS = [
  "linear-gradient(135deg,#5b6b7d,#aebccb)",
  "linear-gradient(135deg,#6d7a6b,#b6c4ad)",
  "linear-gradient(135deg,#5f6f86,#9fb1c9)",
  "linear-gradient(135deg,#7a6d86,#bcb0cb)",
];

// Illustrative session attributes the backend doesn't model yet.
const EXPECT = [
  { icon: "🌬️", title: "Breathwork", text: "Gentle, awakening breath exercises to begin." },
  { icon: "🧘", title: "Guided Practice", text: "A guided journey led step by step." },
  { icon: "🍃", title: "Silent Integration", text: "A few minutes of shared, focused stillness." },
  { icon: "✍️", title: "Intention Setting", text: "Close by setting your core focus." },
];
const INCLUDED = [
  "High-quality lossless audio stream",
  "Post-session summary notes",
  "Access to the recording for 24 hrs",
];

export default function SessionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(false);
  const [alreadyBooked, setAlreadyBooked] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch(`/sessions/${id}/`, { auth: false })
      .then(setSession)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const checkBooked = useCallback(() => {
    if (!isAuthenticated) {
      setAlreadyBooked(false);
      return;
    }
    apiFetch("/bookings/")
      .then((bs) => setAlreadyBooked(bs.some((b) => b.session === Number(id))))
      .catch(() => {});
  }, [isAuthenticated, id]);

  useEffect(() => load(), [load]);
  useEffect(() => checkBooked(), [checkBooked]);

  const book = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setBooking(true);
    try {
      if (Number(session.price) <= 0) {
        await apiFetch("/bookings/", {
          method: "POST",
          body: { session: Number(id) },
        });
        toast.success("Booked! Find it under My Bookings.");
        setAlreadyBooked(true);
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
      theme: { color: "#2563eb" },
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
          setAlreadyBooked(true);
          load();
        } catch (e) {
          toast.error(e.message);
        }
      },
      modal: { ondismiss: () => toast.info("Payment cancelled.") },
    });
    rzp.on("payment.failed", () => toast.error("Payment failed. Please try again."));
    rzp.open();
  };

  if (loading)
    return (
      <div className="container">
        <Loading label="Loading session…" />
      </div>
    );
  if (error)
    return (
      <div className="container">
        <ErrorMessage>{error}</ErrorMessage>
      </div>
    );
  if (!session) return null;

  const full = session.seats_left <= 0;
  const paid = Number(session.price) > 0;
  const category = categoryOf(session);
  const creator = session.creator_name || session.creator_username;
  const initial = (creator || "?")[0].toUpperCase();
  const gradient = GRADIENTS[session.id % GRADIENTS.length];
  const paragraphs = (session.description || "No description provided.")
    .split(/\n{2,}/)
    .filter(Boolean);

  return (
    <div className="container">
      {/* Hero banner */}
      <div className="detail-hero">
        <div className="hero-bg" style={{ background: gradient }} />
        <div className="hero-shade" />
        <div className="hero-content">
          <div className="hero-pills">
            <span className="pill-outline">{category}</span>
            <span className="pill-glass">Live Audio</span>
          </div>
          <h1>{session.title}</h1>
          <p className="lead">
            {paragraphs[0]?.slice(0, 160) ||
              "A guided session to center your mind and set clear intentions."}
          </p>
        </div>
      </div>

      <div className="detail-grid">
        {/* Main column */}
        <div className="detail-main">
          <div className="info-cards">
            <div className="info-card">
              <div className="info-icon">⏱️</div>
              <div className="info-label">DURATION</div>
              <div className="info-value">60 Min</div>
            </div>
            <div className="info-card">
              <div className="info-icon">📊</div>
              <div className="info-label">LEVEL</div>
              <div className="info-value">All Levels</div>
            </div>
            <div className="info-card">
              <div className="info-icon">👥</div>
              <div className="info-label">CAPACITY</div>
              <div className="info-value">{session.capacity} Spots</div>
            </div>
            <div className="info-card">
              <div className="info-icon">🌐</div>
              <div className="info-label">LANGUAGE</div>
              <div className="info-value">English</div>
            </div>
          </div>

          <section className="sec about">
            <h2>About This Session</h2>
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>

          <section className="sec">
            <h2>What to Expect</h2>
            <div className="expect-grid">
              {EXPECT.map((item) => (
                <div className="expect-item" key={item.title}>
                  <div className="expect-icon">{item.icon}</div>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="sec">
            <h2>Upcoming Times</h2>
            <div className="times">
              <div className="time-row active">
                <span className="time-dot" />
                <div className="time-info">
                  <strong>{formatDate(session.datetime)}</strong>
                  <span>
                    {full
                      ? "No spots remaining"
                      : `${session.seats_left} spots remaining`}
                  </span>
                </div>
                <span className="time-badge">Audio Only</span>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="detail-side">
          <div className="price-card">
            <div className="price-top">
              <span className="price-amount">{formatPrice(session.price)}</span>
              <span className="price-per">/ session</span>
            </div>
            {alreadyBooked ? (
              <span className="btn booked book-btn" aria-disabled="true">
                ✓ Already Booked
              </span>
            ) : (
              <button
                className="btn primary book-btn"
                disabled={full || booking}
                onClick={book}
              >
                {booking
                  ? "Processing…"
                  : full
                  ? "Sold out"
                  : isAuthenticated
                  ? "Book Now →"
                  : "Sign in to book →"}
              </button>
            )}
            <p className="secure">
              🔒 {paid ? "Secure payment via Razorpay" : "Free session — no payment needed"}
            </p>
            <ul className="included">
              <li className="included-title">Included in this session:</li>
              {INCLUDED.map((item) => (
                <li key={item}>
                  <span className="check">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="creator-card">
            <div className="creator-top">
              <span className="creator-av">{initial}</span>
              <div>
                <div className="creator-name2">{creator}</div>
                <div className="creator-title">Session Creator</div>
              </div>
            </div>
            <p className="creator-bio">
              {creator} hosts this session on Ahoum, blending experience and care
              to guide your practice.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
