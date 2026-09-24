import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { LoadingPage } from "../common/Loading";
import Pagination from "../common/Pagination";
import TicketDetailDrawer from "./TicketDetailDrawer";
import {
  getTicketStatus,
  getTicketStatusConfig,
  isTicketCancellable,
} from "../../utils/status";

const filters = [
  { value: "all", label: "All bookings" },
  { value: "active", label: "Active" },
  { value: "past", label: "Past bookings" },
];

const TICKETS_PER_PAGE = 5;

function isPast(ticket) {
  return ["expired", "used", "cancelled"].includes(
    getTicketStatus(ticket),
  );
}

export default function Bookings({ tickets, loading, onFind, onCancel }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketAction, setTicketAction] = useState("details");
  
  const selectedFilter = filters.some(
    (filter) => filter.value === searchParams.get("status"),
  )
    ? searchParams.get("status")
    : "all";
  
  const visibleTickets = useMemo(() => 
    tickets.filter((ticket) =>
      selectedFilter === "all"
        ? true
        : selectedFilter === "active"
          ? !isPast(ticket)
          : isPast(ticket),
    ),
    [tickets, selectedFilter]
  );

  // Calculate pagination
  const totalPages = useMemo(
    () => Math.ceil(visibleTickets.length / TICKETS_PER_PAGE),
    [visibleTickets.length]
  );

  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * TICKETS_PER_PAGE;
    const endIndex = startIndex + TICKETS_PER_PAGE;
    return visibleTickets.slice(startIndex, endIndex);
  }, [visibleTickets, currentPage]);

  // Reset to page 1 when filter changes
  useMemo(() => {
    setCurrentPage(1);
  }, [visibleTickets.length]);

  const selectFilter = (status) => {
    setSearchParams({ status });
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openTicket = (ticket, action = "details") => {
    setSelectedTicket(ticket);
    setTicketAction(action);
  };

  return (
    <main className="w-full mx-auto mb-20 mt-8 min-h-screen max-w-6xl px-4 sm:px-6">
      {/* Ticket Detail Drawer */}
      <TicketDetailDrawer
        key={`${selectedTicket?.id}-${ticketAction}`}
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onCancel={onCancel}
        initialAction={ticketAction}
      />
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
        <LoadingPage message="Loading Bookings" subMessage="Fetching your ticket history" showLogo={false} />
      ) : visibleTickets.length ? (
        <>
          {/* Results Summary */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              Showing <span className="font-semibold text-neutral-900">{paginatedTickets.length}</span> of{" "}
              <span className="font-semibold text-neutral-900">{visibleTickets.length}</span> bookings
            </p>
          </div>

          {/* Ticket Cards Grid */}
          <div className="grid gap-4">
            {paginatedTickets.map((ticket) => (
              <BookingTicket
                ticket={ticket}
                key={ticket.id}
                onOpen={openTicket}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
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

function BookingTicket({ ticket, onOpen }) {
  const status = getTicketStatus(ticket);
  const statusConfig = getTicketStatusConfig();
  const currentStatus = statusConfig[status] || statusConfig.active;
  const cancellable = isTicketCancellable(ticket);

  return (
    <article
      className="card card-hover cursor-pointer overflow-hidden transition-smooth hover-lift"
      onClick={() => onOpen(ticket, "details")}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(ticket, "details");
        }
      }}
    >
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

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
        <span className="text-xs text-neutral-500">Click to view details</span>
        {cancellable && (
          <button
            className="btn-ghost text-error-600 hover:bg-error-50"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen(ticket, "cancel");
            }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel Booking
          </button>
        )}
      </div>
    </article>
  );
}

function formatCurrency(amount) {
  return amount == null ? "—" : `₹${Number(amount).toLocaleString("en-IN")}`;
}
