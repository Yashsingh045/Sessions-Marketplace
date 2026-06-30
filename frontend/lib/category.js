// Single source of truth for a session's "type" — used by the cards, the
// detail page, and the filter tags so they always agree. (When the backend
// gains a real category field, swap this to read session.category.)
export const KNOWN_CATEGORIES = [
  "Meditation",
  "Yoga",
  "Sound Healing",
  "Breathwork",
];

export function categoryOf(session) {
  const hay = `${session.title} ${session.description || ""}`.toLowerCase();
  for (const c of KNOWN_CATEGORIES) {
    if (hay.includes(c.split(" ")[0].toLowerCase())) return c;
  }
  return "Session";
}

// The distinct set of categories actually present in a list of sessions,
// in a stable order (known categories first, then any extras).
export function categoriesFrom(sessions) {
  const present = new Set(sessions.map(categoryOf));
  const ordered = KNOWN_CATEGORIES.filter((c) => present.has(c));
  for (const c of present) {
    if (!ordered.includes(c)) ordered.push(c);
  }
  return ordered;
}
