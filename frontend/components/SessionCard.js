"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { categoryOf } from "../lib/category";
import { formatDateShort, formatPrice } from "../lib/format";

// No image field on the backend yet, so we derive a tasteful gradient.
const GRADIENTS = [
  "linear-gradient(135deg,#c8d8c4,#e9f0e6)",
  "linear-gradient(135deg,#e9e1cf,#f4efe3)",
  "linear-gradient(135deg,#bcd3d8,#e7eff1)",
  "linear-gradient(135deg,#d6cee0,#efe9f4)",
  "linear-gradient(135deg,#cfe0d8,#ebf4ef)",
  "linear-gradient(135deg,#e0d3cb,#f4ece6)",
];

export default function SessionCard({ session, booked = false }) {
  const router = useRouter();
  const gradient = GRADIENTS[session.id % GRADIENTS.length];
  const full = session.seats_left <= 0;
  const category = categoryOf(session);
  const creator = session.creator_name || session.creator_username;
  const initial = (creator || "?")[0].toUpperCase();

  const goBook = (e) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/sessions/${session.id}`);
  };

  const noop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Link href={`/sessions/${session.id}`} className="card session-card">
      <div className="card-image" style={{ background: gradient }}>
        <span className="img-badge">🗓 {formatDateShort(session.datetime)}</span>
      </div>
      <div className="card-body">
        <div className="card-row">
          <span className="cat-pill">{category}</span>
          <span className="price">{formatPrice(session.price)}</span>
        </div>
        <h3>{session.title}</h3>
        <p className="muted clamp">
          {session.description || "No description provided."}
        </p>
      </div>
      <div className="card-foot">
        <span className="creator">
          <span className="avatar-xs">{initial}</span>
          <span className="creator-name">{creator}</span>
        </span>
        {booked ? (
          <span className="btn booked sm" onClick={noop} aria-disabled="true">
            ✓ Already Booked
          </span>
        ) : (
          <button className="btn primary sm" onClick={goBook} disabled={full}>
            {full ? "Sold out" : "Book Now"}
          </button>
        )}
      </div>
    </Link>
  );
}
