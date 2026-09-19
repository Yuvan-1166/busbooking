import { useState } from "react";
import { useSearchParams } from "react-router-dom";

const filters = [
  { value: "all", label: "All bookings" },
  { value: "active", label: "Active" },
  { value: "past", label: "Past bookings" },
];

function getTicketStatus(ticket) {
  if (ticket?.ticketStatus) return ticket.ticketStatus.toLowerCase();
  return ticket?.expiresAt && new Date(ticket.expiresAt) <= new Date()
    ? "expired"
    : "active";
}

function isPast(ticket) {
  return ["expired", "used", "cancelled"].includes(
    getTicketStatus(ticket),
  );
}

export default function Bookings({ tickets, loading, onFind, onCancel }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedFilter = filters.some(
    (filter) => filter.value === searchParams.get("status"),
  )
    ? searchParams.get("status")
    : "all";
  const visibleTickets = tickets.filter((ticket) =>
    selectedFilter === "all"
      ? true
      : selectedFilter === "active"
        ? !isPast(ticket)
        : isPast(ticket),
  );

  const selectFilter = (status) => setSearchParams({ status });

  return (
    <main className="mx-auto mb-20 mt-8 min-h-screen max-w-6xl px-4 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <h1 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">
            My Bookings
          </h1>
        </div>
        <p className="text-neutral-600">
          View and manage your bus tickets and booking history
        </p>
      </div>

      {/* Filter Tabs */}
      <nav className="mb-6 flex gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1" aria-label="Booking filters">
        {filters.map((filter) => {
          const count = filter.value === "all"
            ? tickets.length
            : tickets.filter((ticket) =>
                filter.value === "active" ? !isPast(ticket) : isPast(ticket)
              ).length;
          
          return (
            <button
              className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                selectedFilter === filter.value
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
              key={filter.value}
              onClick={() => selectFilter(filter.value)}
            >
              {filter.label}
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                selectedFilter === filter.value
                  ? "bg-primary-100 text-primary-700"
                  : "bg-neutral-200 text-neutral-600"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading your bookings...</p>
          </div>
        </div>
      ) : visibleTickets.length ? (
        <div className="grid gap-4">
          {visibleTickets.map((ticket) => (
            <BookingTicket ticket={ticket} key={ticket.id} onCancel={onCancel} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200">
            <svg className="h-8 w-8 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-neutral-900">
            No bookings found
          </h2>
          <p className="mb-6 text-neutral-600">
            {selectedFilter === "all"
              ? "Start your journey by booking your first bus ticket"
              : `You don't have any ${selectedFilter} bookings`}
          </p>
          <button
            className="btn btn-primary"
            onClick={onFind}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Find Buses
          </button>
        </div>
      )}
    </main>
  );
}

function BookingTicket({ ticket, onCancel }) {
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [refund, setRefund] = useState(null);
  const [showCancellation, setShowCancellation] = useState(false);
  const status = getTicketStatus(ticket);

  const submitCancellation = async (event) => {
    event.preventDefault();
    setCancelling(true);
    setCancelError("");
    try {
      const response = await onCancel(ticket, reason.trim());
      setRefund(response?.refundAmount ?? null);
      setReason("");
    } catch (error) {
      setCancelError(error.message);
    } finally {
      setCancelling(false);
    }
  };

  const statusConfig = {
    active: { color: "badge-success", icon: "✓", text: "Active" },
    expired: { color: "badge-warning", icon: "⏱", text: "Expired" },
    used: { color: "badge-neutral", icon: "✓", text: "Used" },
    cancelled: { color: "badge-error", icon: "✕", text: "Cancelled" },
  };

  const currentStatus = statusConfig[status] || statusConfig.active;

  return (
    <article className="card card-hover overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-6 py-3">
        <div className="flex items-center gap-3">
          <span className={`badge ${currentStatus.color}`}>
            {currentStatus.icon} {currentStatus.text}
          </span>
          <span className="text-sm text-neutral-600">
            Ref: <span className="font-mono font-semibold text-neutral-900">{ticket.bookingReference}</span>
          </span>
        </div>
        <span className="text-sm font-medium text-neutral-900">
          {formatCurrency(ticket.totalAmount)}
        </span>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="mb-6 grid gap-6 md:grid-cols-3">
          {/* Booking ID */}
          <div>
            <div className="mb-2 text-xs font-medium text-neutral-600">Booking ID</div>
            <div className="font-mono text-xl font-bold text-neutral-900">
              #{ticket.bookingReference}
            </div>
            <div className="mt-1 text-sm text-neutral-600">Trip #{ticket.tripId}</div>
          </div>

          {/* Ticket Number */}
          <div className="text-center">
            <div className="mb-2 text-xs font-medium text-neutral-600">Ticket Number</div>
            <div className="font-mono text-xl font-bold text-primary-600">
              {ticket.ticketNumber}
            </div>
            <div className="mt-1 text-sm text-neutral-600">{ticket.tripDate || "—"}</div>
          </div>

          {/* Passengers */}
          <div className="text-right">
            <div className="mb-2 text-xs font-medium text-neutral-600">Passengers</div>
            <div className="text-xl font-bold text-neutral-900">
              {ticket.passengers?.length || 0}
            </div>
            <div className="mt-1 text-sm text-neutral-600">
              {ticket.passengers?.length === 1 ? "passenger" : "passengers"}
            </div>
          </div>
        </div>

        {/* Expiration Info */}
        {ticket.expiresAt && (
          <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-4 py-3 text-sm">
            <svg className="h-5 w-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-neutral-600">
              Valid until <span className="font-medium text-neutral-900">{new Date(ticket.expiresAt).toLocaleString()}</span>
            </span>
          </div>
        )}
      </div>

      {/* Cancel Button */}
      {status === "active" && ticket.bookingId && !showCancellation && (
        <div className="border-t border-neutral-200 px-6 py-4 text-right">
          <button
            className="btn-ghost text-error-600 hover:bg-error-50"
            type="button"
            onClick={() => setShowCancellation(true)}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel Booking
          </button>
        </div>
      )}

      {/* Cancellation Form */}
      {status === "active" && ticket.bookingId && showCancellation && (
        <form className="border-t border-warning-200 bg-warning-50 p-6" onSubmit={submitCancellation}>
          <div className="mb-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-warning-900">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Cancel this booking?
            </div>
            <p className="text-sm text-warning-800">
              Your payment will be refunded after the cancellation is confirmed by the server.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">
              Reason for cancellation <span className="text-neutral-500">(optional)</span>
            </label>
            <textarea
              className="input min-h-[80px] resize-y"
              maxLength="500"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Let us know why you're cancelling..."
              disabled={cancelling}
            />
          </div>

          {cancelError && (
            <div className="alert alert-error mb-4">
              {cancelError}
            </div>
          )}

          <div className="flex gap-3">
            <button 
              className="btn btn-danger" 
              disabled={cancelling} 
              type="submit"
            >
              {cancelling ? (
                <>
                  <span className="spinner"></span>
                  Cancelling...
                </>
              ) : (
                "Confirm Cancellation"
              )}
            </button>
            {!cancelling && (
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  setShowCancellation(false);
                  setCancelError("");
                }}
              >
                Keep Booking
              </button>
            )}
          </div>
        </form>
      )}

      {/* Refund Success */}
      {refund !== null && (
        <div className="alert alert-success border-t-0 rounded-t-none">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Booking cancelled successfully. Refund initiated: <strong>{formatCurrency(refund)}</strong>
        </div>
      )}
    </article>
  );
}

function formatCurrency(amount) {
  return amount == null ? "—" : `₹${Number(amount).toLocaleString("en-IN")}`;
}
