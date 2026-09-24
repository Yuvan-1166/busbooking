// Shared status helpers used across the booking flow (trips & tickets).

/* ── Cancellation ────────────────────────────────────────────────────────── */

// Extract a human readable cancellation reason from an entity (trip or ticket).
// Backends differ on the field name, so check the common variants defensively.
export function getCancellationReason(entity) {
  if (!entity) return "";
  return (
    entity.cancellationReason ||
    entity.cancelReason ||
    entity.cancelledReason ||
    entity.reason ||
    entity.cancellation_reason ||
    entity.cancelMessage ||
    ""
  );
}

/* ── Trips ───────────────────────────────────────────────────────────────── */

// Trips in a terminal state can no longer be modified.
const TERMINAL_TRIP_STATUSES = new Set(["CANCELLED", "COMPLETED"]);

export function isTripCancellable(trip) {
  return !TERMINAL_TRIP_STATUSES.has(trip?.status);
}

export function isTripCancelled(trip) {
  return (trip?.status || "").toUpperCase() === "CANCELLED";
}

export function getTripStatusBadgeClass(status) {
  switch (status) {
    case "CANCELLED":
      return "badge-error";
    case "COMPLETED":
      return "badge-neutral";
    case "BOARDING":
    case "IN_PROGRESS":
      return "badge-info";
    default:
      return "badge-success";
  }
}

export function getTripStatusLabel(status) {
  const label = (status || "").replace(/_/g, " ").trim();
  return label || "Active";
}

/* ── Tickets ─────────────────────────────────────────────────────────────── */

export function getTicketStatus(ticket) {
  if (ticket?.ticketStatus) return ticket.ticketStatus.toLowerCase();
  return ticket?.expiresAt && new Date(ticket.expiresAt) <= new Date()
    ? "expired"
    : "active";
}

export function isTicketCancellable(ticket) {
  return getTicketStatus(ticket) === "active" && Boolean(ticket.bookingId);
}

export function getTicketStatusConfig() {
  return {
    active: { color: "badge-success", icon: "✓", text: "Active" },
    expired: { color: "badge-warning", icon: "⏱", text: "Expired" },
    used: { color: "badge-neutral", icon: "✓", text: "Used" },
    cancelled: { color: "badge-error", icon: "✕", text: "Cancelled" },
  };
}