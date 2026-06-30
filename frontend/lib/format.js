export function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

export function formatPrice(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return n === 0 ? "Free" : `₹${n.toLocaleString()}`;
}
