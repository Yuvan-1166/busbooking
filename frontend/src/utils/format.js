// Shared formatting helpers for analytics and dashboard KPIs.

/* ── Currency ────────────────────────────────────────────────────────────── */

// Formats a number as Indian rupees. `compact` collapses large values
// (e.g. ₹1.2L, ₹3.4 Cr) for use in cards and chart axes.
export function formatCurrency(value, compact = false) {
  const number = Number(value || 0);

  if (compact) {
    const abs = Math.abs(number);
    if (abs >= 1e7) return `₹${(number / 1e7).toFixed(2)} Cr`;
    if (abs >= 1e5) return `₹${(number / 1e5).toFixed(1)} L`;
    if (abs >= 1e3) return `₹${(number / 1e3).toFixed(1)}K`;
  }

  return `₹${number.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

/* ── Counts ──────────────────────────────────────────────────────────────── */

// Compact large counts: 12,500 → "12.5K", 250,000 → "2.5 L".
export function formatCount(value) {
  const number = Number(value || 0);
  const abs = Math.abs(number);
  if (abs >= 1e7) return `${(number / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `${(number / 1e5).toFixed(1)} L`;
  if (abs >= 1e3) return `${(number / 1e3).toFixed(1)}K`;
  return number.toLocaleString("en-IN");
}

/* ── Percentages ─────────────────────────────────────────────────────────── */

export function formatPercent(value, digits = 1) {
  const number = Number(value || 0);
  return `${number.toFixed(digits)}%`;
}

/* ── Dates ───────────────────────────────────────────────────────────────── */

export function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export function formatFullDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}