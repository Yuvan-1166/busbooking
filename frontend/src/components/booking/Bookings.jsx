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
    <main className="mx-auto mb-[100px] mt-[55px] max-w-[1168px] max-[600px]:mx-4">
      <div className="mb-10">
        <p className="mb-3.5 font-mono text-[10px] tracking-[.13em] text-green">
          TICKETS AND BOOKINGS
        </p>
        <h1 className="mb-3.5 font-display text-5xl font-semibold leading-[.95] tracking-[-.045em] text-ink max-[600px]:text-[40px]">
          Bookings
        </h1>
        <p className="text-sm text-muted">
          Your tickets, travel dates, and booking history.
        </p>
      </div>
      <nav className="mb-7 flex gap-7 overflow-x-auto border-b border-line" aria-label="Booking filters">
        {filters.map((filter) => (
          <button
            className={`shrink-0 border-b-2 bg-transparent pb-3 text-xs ${selectedFilter === filter.value ? "border-orange font-bold text-ink" : "border-transparent text-muted"}`}
            key={filter.value}
            onClick={() => selectFilter(filter.value)}
          >
            {filter.label}
            <span className="ml-1.5 font-mono text-[10px]">
              {filter.value === "all"
                ? tickets.length
                : tickets.filter((ticket) =>
                  filter.value === "active" ? !isPast(ticket) : isPast(ticket),
                  ).length}
            </span>
          </button>
        ))}
      </nav>
      {loading ? (
        <div className="border border-dashed border-line p-[74px_30px] text-center text-sm text-muted">
          Loading your tickets...
        </div>
      ) : visibleTickets.length ? (
        <div className="grid gap-4">
          {visibleTickets.map((ticket) => (
            <BookingTicket ticket={ticket} key={ticket.id} onCancel={onCancel} />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-line p-[74px_30px] text-center">
          <div className="text-2xl text-orange">—</div>
          <h2 className="my-4 font-display text-[30px] font-semibold leading-none text-ink">
            No bookings found
            <br />
            for this filter.
          </h2>
          <p className="mb-6 text-[13px] text-muted">
            Complete a booking to see its ticket here.
          </p>
          <button
            className="border-0 bg-orange px-[17px] py-3.5 font-bold text-white"
            onClick={onFind}
          >
            Find a ride <span className="ml-[18px] text-lg">→</span>
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

  return (
    <article className="border border-[#e7e5dc] bg-paper">
      <div className="flex justify-between p-[18px_25px] font-mono text-[10px] text-muted max-[600px]:block max-[600px]:leading-8">
        <span className={status === "active" ? "text-green" : "text-orange"}>
          ● {status}
        </span>
        <span>
          Reference: <strong>{ticket.bookingReference}</strong>
        </span>
      </div>
      <div className="grid grid-cols-[1fr_1.5fr_1fr] items-center border-y border-dashed border-line px-[25px] py-[30px] max-[600px]:grid-cols-2 max-[600px]:gap-5">
        <div>
          <small className="block font-mono text-[9px] text-muted">BOOKING ID</small>
          <strong className="block font-mono text-xl">#{ticket.bookingReference}</strong>
          <span className="font-mono text-[9px] text-muted">Trip #{ticket.tripId}</span>
        </div>
        <div className="text-center max-[600px]:hidden">✦ ───────── ✦</div>
        <div className="text-right">
          <small className="block font-mono text-[9px] text-muted">TICKET</small>
          <strong className="block font-mono text-xl">{ticket.ticketNumber}</strong>
          <span className="font-mono text-[9px] text-muted">{ticket.tripDate || "Date unavailable"}</span>
        </div>
      </div>
      <div className="flex justify-between gap-4 p-[18px_25px] font-mono text-[10px] text-muted max-[600px]:block max-[600px]:leading-7">
        <span>{ticket.passengers?.length || 0} passenger(s)</span>
        <span className="text-right">Total paid <strong className="ml-1 text-sm text-ink">{formatCurrency(ticket.totalAmount)}</strong><br />{ticket.expiresAt ? `Valid until ${new Date(ticket.expiresAt).toLocaleString()}` : "Expiration unavailable"}</span>
      </div>
      {status === "active" && ticket.bookingId && !showCancellation && (
        <div className="border-t border-line p-[15px_25px] text-right">
          <button
            className="border-0 border-b border-orange bg-transparent p-0 pb-1 text-[11px] text-orange"
            type="button"
            onClick={() => setShowCancellation(true)}
          >
            Cancel booking
          </button>
        </div>
      )}
      {status === "active" && ticket.bookingId && showCancellation && (
        <form className="grid gap-3 border-t border-line bg-[#fffaf4] p-[18px_25px]" onSubmit={submitCancellation}>
          <div>
            <p className="m-0 font-mono text-[10px] uppercase tracking-[.08em] text-orange">Need to cancel?</p>
            <p className="mt-1 text-[11px] text-muted">Your payment will be refunded after the server confirms cancellation.</p>
          </div>
          <label className="grid gap-1.5 font-mono text-[10px] uppercase text-muted">
            Reason <span className="font-sans normal-case text-[10px]">(optional)</span>
            <textarea
              className="min-h-[66px] w-full resize-y border border-line bg-paper p-2.5 text-xs text-ink outline-0 focus:border-orange"
              maxLength="500"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Tell us why you are cancelling"
              disabled={cancelling}
            />
          </label>
          {cancelError && <p className="m-0 text-xs text-[#8c3e2d]" role="alert">{cancelError}</p>}
          <button className="justify-self-start border-0 bg-orange px-3.5 py-2.5 text-left text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={cancelling} type="submit">
            {cancelling ? "Cancelling and refunding..." : "Cancel booking"}
            <span className="ml-5 text-base">→</span>
          </button>
          {!cancelling && (
            <button
              className="justify-self-start border-0 border-b border-line bg-transparent p-0 pb-1 text-[11px] text-muted"
              type="button"
              onClick={() => {
                setShowCancellation(false);
                setCancelError("");
              }}
            >
              Keep booking
            </button>
          )}
        </form>
      )}
      {refund !== null && (
        <div className="border-t border-[#a5bea0] bg-[#e4eee1] p-[15px_25px] text-xs text-green" role="status">
          Booking cancelled. Refund initiated: <strong>{refund}</strong>
        </div>
      )}
    </article>
  );
}

function formatCurrency(amount) {
  return amount == null ? "—" : `₹${Number(amount).toLocaleString("en-IN")}`;
}
