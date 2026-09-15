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
    <article className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 border border-[#e7e5dc] bg-white px-4 py-7 hover:bg-[#fafaf8] transition-colors max-[900px]:grid-cols-[auto_1fr_auto_auto] max-[600px]:grid-cols-[1fr_auto] max-[600px]:gap-3">
      {/* Departure Time */}
      <div className="text-center max-[600px]:col-span-2 max-[600px]:text-left">
        <div className="font-mono text-[13px] font-bold text-ink">
          {trip.departureTime || "—"}
        </div>
        <div className="font-mono text-[10px] text-muted">{trip.tripDate}</div>
      </div>

      {/* Operator & Bus Details */}
      <div className="min-w-0 max-[600px]:col-span-1">
        <div className="font-semibold text-[12px] text-ink truncate">
          {operatorDetails?.name || (loading ? "Loading..." : "—")}
        </div>
        <div className="font-mono text-[10px] text-muted">
          {busDetails ? getBusTypeLabel(busDetails.busType) : "—"}
        </div>
        <div className="font-mono text-[9px] text-muted mt-0.5">
          Reg: {busDetails?.registrationNumber || "—"}
        </div>
      </div>

      {/* Route/Duration - Hidden on mobile */}
      <div className="text-center max-[900px]:hidden">
        <div className="font-mono text-[9px] text-muted">Duration</div>
        <div className="font-mono text-[12px] font-semibold text-ink">
          {trip.duration || "—"}
        </div>
      </div>

      {/* Fare */}
      <div className="text-right">
        <div className="font-mono text-[10px] text-muted">From</div>
        <div className="font-mono text-[14px] font-bold text-orange">
          {formatCurrency(trip.startingFare)}
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={onSelect}
        disabled={loading}
        className="whitespace-nowrap rounded-md bg-orange px-3 py-2 font-semibold text-white text-[12px] hover:bg-[#d97e3a] transition-colors disabled:opacity-50 max-[600px]:px-2.5 max-[600px]:py-1.5"
      >
        {loading ? "..." : "Book"}
      </button>
    </article>
  );
}

function formatCurrency(amount) {
  return amount == null ? "—" : `₹${Number(amount).toLocaleString("en-IN")}`;
}
