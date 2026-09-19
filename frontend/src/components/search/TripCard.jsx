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
      COACH: "Coach",
      LUXURY: "Luxury",
      AC_SLEEPER: "AC Sleeper",
      AC_SEMI_SLEEPER: "AC Semi-Sleeper",
    };
    return typeMap[busType] || busType;
  };

  return (
    <article className="card card-hover group fade-in-up transition-smooth hover-lift">
      <div className="flex items-start justify-between gap-6 max-[600px]:flex-col max-[600px]:gap-4">
        {/* Left: Time & Operator */}
        <div className="flex flex-1 items-start gap-4">
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
              <span className="badge badge-neutral transition-colors">
                {busDetails ? getBusTypeLabel(busDetails.busType) : "—"}
              </span>
              {busDetails?.registrationNumber && (
                <span className="text-neutral-500">
                  {busDetails.registrationNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Middle: Journey Info */}
        <div className="flex flex-1 items-center gap-4 max-[600px]:w-full">
          {/* Departure */}
          <div className="text-center">
            <div className="mb-1 text-2xl font-bold text-neutral-900">
              {trip.departureTime || "—"}
            </div>
            <div className="text-xs text-neutral-500">Departure</div>
          </div>

          {/* Duration */}
          <div className="flex flex-1 flex-col items-center">
            <div className="mb-1 h-px w-full bg-neutral-300"></div>
            <div className="text-xs font-medium text-neutral-600">
              {trip.duration || "—"}
            </div>
          </div>

          {/* Arrival (if available) */}
          <div className="text-center">
            <div className="mb-1 text-2xl font-bold text-neutral-900">
              {trip.arrivalTime || "—"}
            </div>
            <div className="text-xs text-neutral-500">Arrival</div>
          </div>
        </div>

        {/* Right: Price & Action */}
        <div className="flex shrink-0 flex-col items-end gap-3 max-[600px]:w-full max-[600px]:flex-row max-[600px]:items-center max-[600px]:justify-between">
          <div className="text-right max-[600px]:text-left">
            <div className="mb-1 text-xs text-neutral-500">Starting from</div>
            <div className="text-2xl font-bold text-primary-600">
              {formatCurrency(trip.startingFare)}
            </div>
            {trip.availableSeats != null && (
              <div className="mt-1 text-xs text-neutral-500">
                {trip.availableSeats} seats left
              </div>
            )}
          </div>
          
          <button
            onClick={onSelect}
            disabled={loading}
            className="btn btn-primary max-[600px]:flex-1 transition-smooth hover-scale disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></div>
                Loading...
              </span>
            ) : (
              "Select Seats"
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

function formatCurrency(amount) {
  return amount == null ? "—" : `₹${Number(amount).toLocaleString("en-IN")}`;
}
