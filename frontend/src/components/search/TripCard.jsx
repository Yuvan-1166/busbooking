import { useEffect, useState } from "react";
import { api } from "../../api";

export default function TripCard({ trip, onSelect }) {
  const [busDetails, setBusDetails] = useState(null);
  const [operatorDetails, setOperatorDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const bus = await api.getBus(trip.busId);
        setBusDetails(bus);

        if (bus.operatorId) {
          const operator = await api.getOperator(bus.operatorId);
          setOperatorDetails(operator);
        }
      } catch (error) {
        console.error("Error fetching trip details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [trip.busId]);

  const getBusTypeLabel = (busType) => {
    const typeMap = {
      SLEEPER: "Sleeper",
      SEMI_SLEEPER: "Semi-Sleeper",
      SEATER: "Seater",
      COACH: "Coach",
      LUXURY: "Luxury",
      AC_SLEEPER: "AC Sleeper",
      AC_SEMI_SLEEPER: "AC Semi-Sleeper",
    };
    return typeMap[busType] || busType;
  };

  return (
    <article className="card card-hover group fade-in-up transition-smooth hover-lift overflow-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: Operator & Bus Info */}
        <div className="flex items-start gap-4 min-w-0 flex-1">
          {/* Operator Badge */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-xl font-bold text-primary-600 transition-transform group-hover:scale-105">
            {operatorDetails?.name?.[0] || "B"}
          </div>
          
          {/* Operator & Bus Info */}
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 truncate text-base font-semibold text-neutral-900 transition-colors">
              {operatorDetails?.name || (loading ? "Loading..." : "Bus Operator")}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600">
              <span className="badge badge-neutral transition-colors shrink-0">
                {busDetails ? getBusTypeLabel(busDetails.busType) : "—"}
              </span>
              {busDetails?.registrationNumber && (
                <span className="text-neutral-500 truncate">
                  {busDetails.registrationNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Middle: Journey Info */}
        <div className="flex items-center justify-between gap-4 w-full sm:w-auto sm:flex-none">
          {/* Departure */}
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-neutral-900">
              {trip.departureTime || "—"}
            </div>
            <div className="text-xs text-neutral-500">Departure</div>
          </div>

          {/* Duration - Hidden on mobile */}
          <div className="hidden sm:flex flex-col items-center gap-1">
            <div className="h-px w-12 bg-neutral-300"></div>
            <div className="text-xs font-medium text-neutral-600">
              {trip.duration || "—"}
            </div>
          </div>

          {/* Arrival */}
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-neutral-900">
              {trip.arrivalTime || "—"}
            </div>
            <div className="text-xs text-neutral-500">Arrival</div>
          </div>
        </div>

        {/* Right: Price & Action */}
        <div className="flex items-center justify-between gap-3 w-full sm:w-auto sm:flex-col sm:items-end">
          <div className="text-left sm:text-right">
            <div className="text-xs text-neutral-500">Starting from</div>
            <div className="text-xl sm:text-2xl font-bold text-primary-600">
              {formatCurrency(trip.startingFare)}
            </div>
            {trip.availableSeats != null && (
              <div className="mt-1 text-xs text-neutral-500">
                {trip.availableSeats} seats
              </div>
            )}
          </div>
          
          <button
            onClick={onSelect}
            disabled={loading}
            className="btn btn-primary sm:whitespace-nowrap transition-smooth hover-scale disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></div>
                <span className="hidden sm:inline">Loading...</span>
              </span>
            ) : (
              <span className="hidden sm:inline">Select Seats</span>
            )}
            {!loading && <span className="sm:hidden">Select</span>}
          </button>
        </div>
      </div>
    </article>
  );
}

function formatCurrency(amount) {
  return amount == null ? "—" : `₹${Number(amount).toLocaleString("en-IN")}`;
}
