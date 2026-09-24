import { useMemo, useState } from "react";
import RightDrawer from "../common/RightDrawer";
import { getErrorMessage } from "../../utils/errorHandler";
import {
  getCancellationReason,
  getTripStatusBadgeClass,
  getTripStatusLabel,
  isTripCancellable,
  isTripCancelled,
} from "../../utils/status";

const INITIAL_ACTIONS = {
  details: false,
  cancel: true,
};

export default function TripDetailDrawer({
  trip,
  schedules,
  routes,
  buses,
  onClose,
  onUpdate,
  onCancelTrip,
  saving = false,
  initialAction = "details",
}) {
  const [tripDate, setTripDate] = useState(trip?.tripDate || "");
  const [scheduleId, setScheduleId] = useState(
    trip?.scheduleId == null ? "" : String(trip.scheduleId),
  );
  const [showCancelForm, setShowCancelForm] = useState(
    INITIAL_ACTIONS[initialAction] ?? false,
  );
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  const currentSchedule = schedules.find(
    (schedule) => String(schedule.id) === String(trip?.scheduleId),
  );
  const route = routes.find((route) => route.id === currentSchedule?.routeId);
  const bus = buses.find((bus) => bus.id === currentSchedule?.busId);

  // Only schedules on the same route are offered, so reallocating a bus
  // changes the vehicle/departure without accidentally changing the route.
  const reallocationOptions = useMemo(() => {
    if (!currentSchedule) return [];
    return schedules.filter(
      (schedule) => String(schedule.routeId) === String(currentSchedule.routeId),
    );
  }, [schedules, currentSchedule]);

  const cancellable = isTripCancellable(trip);
  const cancelled = isTripCancelled(trip);
  const cancellationReason = getCancellationReason(trip);

  if (!trip) return null;

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    if (!reallocationOptions.length)
      return setError("No schedules are available for this route.");
    if (!scheduleId) return setError("Please choose a bus for this trip.");
    try {
      await onUpdate(trip.id, {
        scheduleId: Number(scheduleId),
        tripDate,
      });
      onClose();
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    }
  };

  const handleCancel = async (event) => {
    event.preventDefault();
    setError("");
    if (!cancelReason.trim())
      return setError("Please provide a reason for cancellation.");
    setCancelling(true);
    try {
      await onCancelTrip(trip.id, cancelReason.trim());
      onClose();
    } catch (cancelError) {
      setError(getErrorMessage(cancelError));
    } finally {
      setCancelling(false);
    }
  };

  const scheduleLabel = (schedule) => {
    const optionBus = buses.find((bus) => bus.id === schedule.busId);
    const current = String(schedule.id) === String(trip.scheduleId);
    return `${optionBus?.registrationNumber || "Unknown bus"} • ${schedule.departureTime}${current ? " (current)" : ""}`;
  };

  return (
    <RightDrawer
      isOpen
      onClose={onClose}
      title="Trip Details"
      subtitle={route?.name || "Unknown Route"}
      width="max-w-lg"
    >
      <div className="space-y-6">
        {error && <div className="alert alert-error">{error}</div>}

        {/* Status header */}
        <div className="flex items-center justify-between">
          <span
            className={`badge ${getTripStatusBadgeClass(trip.status)}`}
          >
            {getTripStatusLabel(trip.status)}
          </span>
          <span className="text-xs text-neutral-500">
            {trip.tripDate || "—"}
            {currentSchedule?.departureTime
              ? ` · ${currentSchedule.departureTime}`
              : ""}
          </span>
        </div>

        {/* Read-only trip details */}
        <div className="overflow-hidden rounded-lg border border-neutral-200">
          <DetailRow label="Route" value={route?.name || "—"} />
          <DetailRow
            label="Departure"
            value={currentSchedule?.departureTime || "—"}
          />
          <DetailRow label="Trip Date" value={trip.tripDate || "—"} />
          <DetailRow
            label="Bus"
            value={
              bus
                ? `${bus.model || "Bus"} • ${bus.registrationNumber}`
                : "—"
            }
          />
          <DetailRow
            label="Fare"
            value={
              currentSchedule
                ? `₹${currentSchedule.baseFare} + ₹${currentSchedule.pricePerKm}/km`
                : "—"
            }
          />
        </div>

        {/* Cancellation reason */}
        {cancelled && cancellationReason && (
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

        {cancellable ? (
          <>
            {/* Reschedule / reallocate bus */}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <h3 className="mb-3 text-sm font-medium text-neutral-700">
                  Reschedule or Reallocate Bus
                </h3>
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-neutral-700">
                      Trip Date
                    </span>
                    <input
                      type="date"
                      required
                      value={tripDate}
                      onChange={(event) => setTripDate(event.target.value)}
                      className="input"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-neutral-700">
                      Bus
                    </span>
                    <select
                      required
                      value={scheduleId}
                      onChange={(event) => setScheduleId(event.target.value)}
                      className="select"
                    >
                      {reallocationOptions.length === 0 && (
                        <option value="">No schedules available</option>
                      )}
                      {reallocationOptions.map((schedule) => (
                        <option key={schedule.id} value={schedule.id}>
                          {scheduleLabel(schedule)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary w-full"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>

            {/* Trip cancellation */}
            <div className="border-t border-neutral-200 pt-4">
              {showCancelForm ? (
                <form onSubmit={handleCancel} className="space-y-4">
                  <div>
                    <p className="mb-1 text-sm font-semibold text-error-700">
                      Cancel this trip?
                    </p>
                    <p className="mb-3 text-sm text-neutral-500">
                      All passengers will be refunded and their bookings moved
                      to past trips.
                    </p>
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-neutral-700">
                        Reason for Cancellation *
                      </span>
                      <textarea
                        required
                        rows={3}
                        value={cancelReason}
                        onChange={(event) =>
                          setCancelReason(event.target.value)
                        }
                        placeholder="e.g., Driver unavailable, Bus breakdown, Route issues"
                        className="input resize-y"
                      />
                    </label>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCancelForm(false);
                        setCancelReason("");
                      }}
                      disabled={cancelling}
                      className="btn btn-ghost flex-1"
                    >
                      Keep Trip
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
                  Cancel Trip
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-neutral-500">
            This trip is {getTripStatusLabel(trip.status).toLowerCase()} and can
            no longer be modified.
          </p>
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