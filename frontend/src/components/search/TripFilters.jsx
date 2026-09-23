import { useState, useMemo } from "react";

export default function TripFilters({ trips, onFiltersChange, getTripFare }) {
  const [filters, setFilters] = useState({
    busType: [],
    priceRange: [0, 5000],
    departureTime: [],
    operatorName: [],
  });

  const [isOpen, setIsOpen] = useState(false);

  // Extract unique values for filters
  const busTypes = useMemo(
    () => [...new Set(trips.map((trip) => trip.busType).filter(Boolean))],
    [trips]
  );

  const operators = useMemo(
    () => [...new Set(trips.map((trip) => trip.operatorName).filter(Boolean))],
    [trips]
  );

  const maxPrice = useMemo(
    () =>
      Math.max(...trips.map((trip) => getTripFare(trip) || 0).filter(Boolean)),
    [trips, getTripFare]
  );

  // Get unique departure time slots
  const departureSlots = useMemo(() => {
    const times = trips
      .map((trip) => {
        if (!trip.departureTime) return null;
        const hour = parseInt(trip.departureTime.split(":")[0]);
        if (hour < 6) return "Night (00:00-06:00)";
        if (hour < 12) return "Morning (06:00-12:00)";
        if (hour < 18) return "Afternoon (12:00-18:00)";
        return "Evening (18:00-24:00)";
      })
      .filter(Boolean);
    return [...new Set(times)];
  }, [trips]);

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters };

    if (filterType === "priceRange") {
      newFilters.priceRange = value;
    } else if (Array.isArray(newFilters[filterType])) {
      if (newFilters[filterType].includes(value)) {
        newFilters[filterType] = newFilters[filterType].filter(
          (v) => v !== value
        );
      } else {
        newFilters[filterType] = [...newFilters[filterType], value];
      }
    }

    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const activeFilterCount = useMemo(() => {
    return (
      filters.busType.length +
      filters.operatorName.length +
      filters.departureTime.length +
      (filters.priceRange[0] !== 0 || filters.priceRange[1] !== maxPrice ? 1 : 0)
    );
  }, [filters, maxPrice]);

  const resetFilters = () => {
    const resetState = {
      busType: [],
      priceRange: [0, maxPrice],
      departureTime: [],
      operatorName: [],
    };
    setFilters(resetState);
    onFiltersChange(resetState);
  };

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
    <div className="mb-8">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between mb-4 max-[600px]:flex-col max-[600px]:gap-3 max-[600px]:items-start">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-md border border-[#e7e5dc] bg-white px-4 py-2 font-semibold text-ink hover:bg-[#fafaf8] transition-colors max-[600px]:w-full max-[600px]:justify-center"
        >
          <span>🔍 Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange text-xs font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="text-sm text-orange hover:text-[#d97e3a] font-semibold transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <div className="rounded-lg border border-[#e7e5dc] bg-[#fafaf8] p-6 max-[600px]:p-4">
          <div className="grid grid-cols-2 gap-8 max-[900px]:grid-cols-1 max-[600px]:gap-4">
            {/* Bus Type Filter */}
            {busTypes.length > 0 && (
              <div>
                <h3 className="mb-3 font-semibold text-ink">Bus Type</h3>
                <div className="space-y-2">
                  {busTypes.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.busType.includes(type)}
                        onChange={() => handleFilterChange("busType", type)}
                        className="h-4 w-4 rounded border-[#c8cdc3] text-orange"
                      />
                      <span className="text-sm text-[#606a5d]">
                        {getBusTypeLabel(type)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Operator Filter */}
            {operators.length > 0 && (
              <div>
                <h3 className="mb-3 font-semibold text-ink">Operator</h3>
                <div className="max-h-[200px] space-y-2 overflow-y-auto">
                  {operators.map((op) => (
                    <label
                      key={op}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.operatorName.includes(op)}
                        onChange={() =>
                          handleFilterChange("operatorName", op)
                        }
                        className="h-4 w-4 rounded border-[#c8cdc3] text-orange"
                      />
                      <span className="text-sm text-[#606a5d] truncate">
                        {op}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Departure Time Filter */}
            {departureSlots.length > 0 && (
              <div>
                <h3 className="mb-3 font-semibold text-ink">Departure Time</h3>
                <div className="space-y-2">
                  {departureSlots.map((slot) => (
                    <label
                      key={slot}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.departureTime.includes(slot)}
                        onChange={() =>
                          handleFilterChange("departureTime", slot)
                        }
                        className="h-4 w-4 rounded border-[#c8cdc3] text-orange"
                      />
                      <span className="text-sm text-[#606a5d]">{slot}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range Filter */}
            {maxPrice > 0 && (
              <div>
                <h3 className="mb-3 font-semibold text-ink">Price Range</h3>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max={maxPrice}
                    value={filters.priceRange[1]}
                    onChange={(e) =>
                      handleFilterChange("priceRange", [
                        0,
                        parseInt(e.target.value),
                      ])
                    }
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#606a5d]">
                      ₹{filters.priceRange[0].toLocaleString("en-IN")}
                    </span>
                    <span className="font-semibold text-ink">
                      ₹{filters.priceRange[1].toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
