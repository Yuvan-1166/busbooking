import { useEffect, useState } from "react";
import RightDrawer from "../common/RightDrawer";
import { api } from "../../api";
import { enrichTicketData } from "../../utils/ticketEnricher";
import { busLabel, passengerName, seatNumber, tripLabel } from "../../utils/reference";
import { getErrorMessage } from "../../utils/errorHandler";
import {
  getCancellationReason,
  getTicketStatus,
  getTicketStatusConfig,
  isTicketCancellable,
} from "../../utils/status";

const INITIAL_ACTIONS = {
  details: false,
  cancel: true,
};

const BUS_TYPE_LABELS = {
  SEATER: "Seater",
  SLEEPER: "Sleeper",
  SEMI_SLEEPER: "Semi-Sleeper",
};

export default function TicketDetailDrawer({
  ticket,
  onClose,
  onCancel,
  initialAction = "details",
}) {
  const [showCancelForm, setShowCancelForm] = useState(
    INITIAL_ACTIONS[initialAction] ?? false,
  );
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [refund, setRefund] = useState(null);
  const [details, setDetails] = useState(ticket);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!ticket) return;
    let active = true;
    setDetails(ticket);
    setLoadingDetails(true);
    enrichTicketData(ticket, api)
      .then((enriched) => {
        if (active) setDetails(enriched);
      })
      .finally(() => {
        if (active) setLoadingDetails(false);
      });
    return () => {
      active = false;
    };
  }, [ticket]);

  if (!ticket) return null;

  const status = getTicketStatus(details);
  const statusConfig = getTicketStatusConfig();
  const currentStatus = statusConfig[status] || statusConfig.active;
  const cancellable = isTicketCancellable(details);
  const cancellationReason = getCancellationReason(details);
  const journey = details.journey || {};
  const passengers = details.passengers || [];
  const routeName =
    details.routeName ||
    journey.routeName ||
    (details.route?.name ?? "");
  const from =
    details.pickupLocationName ||
    journey.pickupLocationName ||
    "";
  const to =
    details.dropLocationName ||
    journey.dropLocationName ||
    "";
  const departureTime =
    details.departureTime ||
    journey.schedule?.departureTime ||
    journey.trip?.departureTime ||
    "";
  const bus = journey.bus || (details.bus && typeof details.bus === "object" ? details.bus : null);
  const operatorName = journey.operatorName || details.operatorName || "";

  const submitCancellation = async (event) => {
    event.preventDefault();
    setCancelling(true);
    setCancelError("");
    try {
      const response = await onCancel(ticket, reason.trim());
      setRefund(response?.refundAmount ?? null);
      setReason("");
      setShowCancelForm(false);
    } catch (error) {
      setCancelError(getErrorMessage(error));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <RightDrawer
      isOpen
      onClose={onClose}
      title="Ticket Details"
      subtitle={ticket.bookingReference || "Booking"}
      width="max-w-lg"
    >
      <div className="space-y-6">
        {/* Status header */}
        <div className="flex items-center justify-between">
          <span className={`badge ${currentStatus.color}`}>
            {currentStatus.icon} {currentStatus.text}
          </span>
          <span className="text-sm text-neutral-500">
            {formatCurrency(details.totalAmount)}
          </span>
        </div>

        {loadingDetails && (
          <p className="text-xs text-neutral-400">
            Loading journey details...
          </p>
        )}

        {/* Journey */}
        {(routeName || from || to) && (
          <section className="overflow-hidden rounded-lg border border-neutral-200">
            <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
              <p className="text-sm font-semibold text-neutral-900">Journey</p>
              {routeName && (
                <p className="mt-0.5 text-xs text-neutral-500">
                  Route: {routeName}
                </p>
              )}
            </div>
            <div className="py-2">
              {from && to && (
                <DetailRow
                  label="From"
                  value={from}
                />
              )}
              {from && to && (
                <DetailRow
                  label="To"
                  value={to}
                />
              )}
              <DetailRow
                label="Trip"
                value={tripLabel(details)}
              />
              {details.tripDate && (
                <DetailRow label="Trip Date" value={details.tripDate} />
              )}
              {departureTime && (
                <DetailRow label="Departure" value={departureTime} />
              )}
            </div>
          </section>
        )}

        {/* Bus & operator */}
        {(operatorName || bus) && (
          <section className="overflow-hidden rounded-lg border border-neutral-200">
            <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
              <p className="text-sm font-semibold text-neutral-900">
                Bus &amp; Operator
              </p>
            </div>
            <div className="py-2">
              {operatorName ? (
                <DetailRow label="Operator" value={operatorName} />
              ) : null}
              {bus ? (
                <DetailRow label="Bus" value={getBusLabel(bus)} />
              ) : null}
              {bus?.busType ? (
                <DetailRow label="Bus Type" value={getBusTypeLabel(bus.busType)} />
              ) : null}
              {bus?.registrationNumber ? (
                <DetailRow
                  label="Registration"
                  value={bus.registrationNumber}
                />
              ) : null}
            </div>
          </section>
        )}

        {/* Booking references */}
        <section className="overflow-hidden rounded-lg border border-neutral-200">
          <DetailRow label="Booking Reference" value={details.bookingReference || "—"} />
          <DetailRow label="Ticket Number" value={details.ticketNumber || "—"} />
          {details.expiresAt && (
            <DetailRow
              label="Valid Until"
              value={new Date(details.expiresAt).toLocaleString()}
            />
          )}
        </section>

        {/* Passengers */}
        <section className="overflow-hidden rounded-lg border border-neutral-200">
          <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
            <p className="text-sm font-semibold text-neutral-900">
              Passengers ({passengers.length})
            </p>
          </div>
          {passengers.length ? (
            <div className="divide-y divide-neutral-100">
              {passengers.map((passenger, index) => (
                <div
                  key={passenger.id ?? index}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-neutral-900">
                      {getPassengerName(passenger)}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-500">
                      {getPassengerMeta(passenger)}
                    </p>
                  </div>
                  <span className="badge badge-neutral shrink-0">
                    Seat {getSeatNumber(passenger)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-4 py-3 text-sm text-neutral-500">
              No passenger details available.
            </p>
          )}
        </section>

        {/* Cancellation reason */}
        {status === "cancelled" && cancellationReason && (
          <div className="rounded-lg border border-error-200 bg-error-50 p-4">
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-error-700">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Cancellation reason
            </p>
            <p className="text-sm text-error-700">{cancellationReason}</p>
          </div>
        )}

        {/* Refund success */}
        {refund !== null && (
          <div className="flex items-center gap-3 rounded-lg border border-success-200 bg-success-50 p-4">
            <svg
              className="h-5 w-5 shrink-0 text-success-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-success-700">
              Booking cancelled successfully. Refund initiated:{" "}
              <strong>{formatCurrency(refund)}</strong>
            </p>
          </div>
        )}

        {/* Cancellation flow for active tickets */}
        {cancellable && refund === null && (
          <div className="border-t border-neutral-200 pt-4">
            {showCancelForm ? (
              <form onSubmit={submitCancellation} className="space-y-4">
                <div>
                  <p className="mb-1 text-sm font-semibold text-error-700">
                    Cancel this booking?
                  </p>
                  <p className="mb-3 text-sm text-neutral-500">
                    Your payment will be refunded after the cancellation is
                    confirmed by the server.
                  </p>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-neutral-700">
                      Reason for cancellation{" "}
                      <span className="text-neutral-500">(optional)</span>
                    </span>
                    <textarea
                      maxLength="500"
                      rows={3}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Let us know why you're cancelling..."
                      disabled={cancelling}
                      className="input resize-y"
                    />
                  </label>
                </div>

                {cancelError && (
                  <div className="alert alert-error">{cancelError}</div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCancelForm(false);
                      setCancelError("");
                    }}
                    disabled={cancelling}
                    className="btn btn-ghost flex-1"
                  >
                    Keep Booking
                  </button>
                  <button
                    type="submit"
                    disabled={cancelling}
                    className="btn btn-danger flex-1"
                  >
                    {cancelling ? "Cancelling..." : "Confirm Cancellation"}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowCancelForm(true)}
                className="btn-ghost w-full text-error-600"
              >
                Cancel Booking
              </button>
            )}
          </div>
        )}
      </div>
    </RightDrawer>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-neutral-100 px-4 py-2.5 last:border-b-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-right text-sm font-semibold text-neutral-900">
        {value}
      </span>
    </div>
  );
}

function getBusLabel(bus) {
  if (!bus) return "—";
  return busLabel(bus);
}

function getBusTypeLabel(busType) {
  return BUS_TYPE_LABELS[busType] || (busType ? String(busType).replace(/_/g, " ") : "—");
}

function getPassengerName(passenger) {
  return passengerName(passenger);
}

function getPassengerMeta(passenger) {
  const gender =
    passenger.gender &&
    passenger.gender.charAt(0).toUpperCase() +
      passenger.gender.slice(1).toLowerCase();
  const parts = [];
  if (gender) parts.push(gender);
  if (passenger.age != null) parts.push(`${passenger.age} years`);
  return parts.join(" · ") || "Passenger";
}

function getSeatNumber(passenger) {
  if (passenger.seatNumber) return passenger.seatNumber;
  return passenger.seat ? seatNumber(passenger.seat) : "—";
}

function formatCurrency(amount) {
  return amount == null ? "—" : `₹${Number(amount).toLocaleString("en-IN")}`;
}