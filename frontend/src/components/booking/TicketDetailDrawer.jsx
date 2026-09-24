import { useState } from "react";
import RightDrawer from "../common/RightDrawer";
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

  if (!ticket) return null;

  const status = getTicketStatus(ticket);
  const statusConfig = getTicketStatusConfig();
  const currentStatus = statusConfig[status] || statusConfig.active;
  const cancellable = isTicketCancellable(ticket);
  const cancellationReason = getCancellationReason(ticket);
  const passengerCount = ticket.passengers?.length || 0;

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
            {formatCurrency(ticket.totalAmount)}
          </span>
        </div>

        {/* Read-only ticket details */}
        <div className="overflow-hidden rounded-lg border border-neutral-200">
          <DetailRow label="Booking ID" value={`#${ticket.bookingReference}`} />
          <DetailRow label="Ticket Number" value={ticket.ticketNumber || "—"} />
          <DetailRow label="Trip" value={ticket.tripId ? `Trip #${ticket.tripId}` : "—"} />
          <DetailRow label="Trip Date" value={ticket.tripDate || "—"} />
          <DetailRow
            label="Passengers"
            value={passengerCount ? `${passengerCount} ${passengerCount === 1 ? "passenger" : "passengers"}` : "—"}
          />
          {ticket.expiresAt && (
            <DetailRow
              label="Valid Until"
              value={new Date(ticket.expiresAt).toLocaleString()}
            />
          )}
        </div>

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
    <div className="flex items-center justify-between gap-4 border-b border-neutral-100 px-4 py-3 last:border-b-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-right text-sm font-semibold text-neutral-900">
        {value}
      </span>
    </div>
  );
}

function formatCurrency(amount) {
  return amount == null ? "—" : `₹${Number(amount).toLocaleString("en-IN")}`;
}