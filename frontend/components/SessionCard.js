"use client";

import Link from "next/link";

import { formatDate, formatPrice } from "../lib/format";

export default function SessionCard({ session }) {
  const full = session.seats_left <= 0;
  return (
    <Link href={`/sessions/${session.id}`} className="card session-card">
      <div className="card-body">
        <h3>{session.title}</h3>
        <p className="muted clamp">
          {session.description || "No description provided."}
        </p>
        <div className="meta">
          <span>🗓 {formatDate(session.datetime)}</span>
          <span>👤 {session.creator_name || session.creator_username}</span>
        </div>
      </div>
      <div className="card-foot">
        <span className="price">{formatPrice(session.price)}</span>
        <span className={`pill ${full ? "danger" : "ok"}`}>
          {full ? "Sold out" : `${session.seats_left} seats left`}
        </span>
      </div>
    </Link>
  );
}
