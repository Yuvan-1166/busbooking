import { useEffect, useState, useMemo } from "react";
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

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "amount-desc", label: "Amount: high to low" },
  { value: "amount-asc", label: "Amount: low to high" },
  { value: "reference", label: "Booking ref: A to Z" },
];

const TICKETS_PER_PAGE = 5;

function isPast(ticket) {
  return ["expired", "used", "cancelled"].includes(
    getTicketStatus(ticket),
  );
}

function matchesQuery(ticket, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const haystack = [
    ticket.bookingReference,
    ticket.ticketNumber,
    ticket.tripId,
    ticket.routeName,
    ticket.pickupLocationName,
    ticket.dropLocationName,
    ticket.operatorName,
    ticket.busModel,
    ticket.busRegistrationNumber,
    ...(ticket.passengers || []).map((p) =>
      [p.firstName, p.lastName].filter(Boolean).join(" "),
    ),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function sortTickets(tickets, sort) {
  const sorted = [...tickets];

  const byTripDate = (a, b, direction) => {
    const dateA = a.tripDate || (a.expiresAt || "").slice(0, 10);
    const dateB = b.tripDate || (b.expiresAt || "").slice(0, 10);
    return dateA.localeCompare(dateB) * direction || (a.id - b.id) * direction;
  };

  switch (sort) {
    case "oldest":
      return sorted.sort((a, b) => byTripDate(a, b, 1));
    case "amount-desc":
      return sorted.sort(
        (a, b) => Number(b.totalAmount || 0) - Number(a.totalAmount || 0),
      );
    case "amount-asc":
      return sorted.sort(
        (a, b) => Number(a.totalAmount || 0) - Number(b.totalAmount || 0),
      );
    case "reference":
      return sorted.sort((a, b) =>
        String(a.bookingReference || "").localeCompare(
          String(b.bookingReference || ""),
        ),
      );
    case "newest":
    default:
      return sorted.sort((a, b) => byTripDate(a, b, -1));
  }
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

  const rawQuery = searchParams.get("q") || "";
  const query = rawQuery.trim();

  const sort = SORT_OPTIONS.some((option) => option.value === searchParams.get("sort"))
    ? searchParams.get("sort")
    : "newest";

  // Set a query parameter, removing it when it equals the default/empty value.
  const setParam = (key, value, options) => {
    const next = { ...Object.fromEntries(searchParams.entries()) };
    if (value == null || value === "" || value === "all" || value === "newest") {
      delete next[key];
    } else {
      next[key] = String(value);
    }
    setSearchParams(next, options);
  };

  const selectFilter = (status) => setParam("status", status);

  // Reset to page 1 whenever the visible set changes (filters, search, sort,
  // or the underlying tickets), so filters stay consistent across pages.
  useEffect(() => {
    setCurrentPage(1);
  }, [tickets, selectedFilter, query, sort]);

  const statusFilteredTickets = useMemo(
    () =>
      tickets.filter((ticket) =>
        selectedFilter === "all"
          ? true
          : selectedFilter === "active"
            ? !isPast(ticket)
            : isPast(ticket),
      ),
    [tickets, selectedFilter],
  );

  const searchedTickets = useMemo(
    () => statusFilteredTickets.filter((ticket) => matchesQuery(ticket, query)),
    [statusFilteredTickets, query],
  );

  const filteredTickets = useMemo(
    () => sortTickets(searchedTickets, sort),
    [searchedTickets, sort],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTickets.length / TICKETS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);

  const paginatedTickets = useMemo(() => {
    const startIndex = (safePage - 1) * TICKETS_PER_PAGE;
    return filteredTickets.slice(startIndex, startIndex + TICKETS_PER_PAGE);
  }, [filteredTickets, safePage]);

  const hasActiveCriteria = query !== "" || selectedFilter !== "all";

  const openTicket = (ticket, action = "details") => {
    setSelectedTicket(ticket);
    setTicketAction(action);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setParam("q", "", { replace: true });
    selectFilter("all");
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
      <nav className="mb-4 flex gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1" aria-label="Booking filters">
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

      {/* Search & order controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-xs">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={rawQuery}
            onChange={(event) =>
              setParam("q", event.target.value, { replace: true })
            }
            placeholder="       Search by ref, ticket, passenger, bus..."
            className="input pl-9"
          />
        </label>

        <label className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">Order by</span>
          <select
            className="select"
            value={sort}
            onChange={(event) => setParam("sort", event.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingPage message="Loading Bookings" subMessage="Fetching your ticket history" showLogo={false} />
      ) : filteredTickets.length ? (
        <>
          {/* Results Summary */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              Showing <span className="font-semibold text-neutral-900">{paginatedTickets.length}</span> of{" "}
              <span className="font-semibold text-neutral-900">{filteredTickets.length}</span> bookings
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
                currentPage={safePage}
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
            {hasActiveCriteria ? "No matching bookings" : "No bookings found"}
          </h2>
          <p className="mb-6 text-neutral-600">
            {hasActiveCriteria
              ? "No tickets match your current filters or search."
              : "Start your journey by booking your first bus ticket"}
          </p>
          {hasActiveCriteria ? (
            <button
              className="btn btn-ghost"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={onFind}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find Buses
            </button>
          )}
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

        {/* Operator & bus info */}
        {(ticket.operatorName || ticket.busModel) && (
          <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600">
            {ticket.operatorName && (
              <span>
                Operator: <span className="font-semibold text-neutral-900">{ticket.operatorName}</span>
              </span>
            )}
            {ticket.busModel && (
              <span>
                Bus: <span className="font-semibold text-neutral-900">{ticket.busModel}</span>
              </span>
            )}
            {ticket.pickupLocationName && ticket.dropLocationName && (
              <span>
                {ticket.pickupLocationName} <span className="text-neutral-400">→</span>{" "}
                <span className="font-semibold text-neutral-900">{ticket.dropLocationName}</span>
              </span>
            )}
          </div>
        )}

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