import { useState, useMemo } from "react";
import DualRangeSlider from "../common/DualRangeSlider";

export default function FilterSidebar({
  trips,
  filters,
  onFilterChange,
  getTripFare,
}) {
  const [expandedGroups, setExpandedGroups] = useState({
    price: true,
    departure: true,
    duration: false,
    busType: true,
    busModel: false,
    operator: false,
    femaleSeats: false,
  });

  const [searchTerms, setSearchTerms] = useState({
    operator: "",
    busModel: "",
  });

  const [priceInputs, setPriceInputs] = useState({
    min: filters.priceRange[0],
    max: filters.priceRange[1],
  });

  // Extract unique values
  const busTypes = useMemo(
    () => [...new Set(trips.map((t) => t.busType).filter(Boolean))],
    [trips]
  );

  const busModels = useMemo(
    () => [...new Set(trips.map((t) => t.busModel).filter(Boolean))],
    [trips]
  );

  const operators = useMemo(
    () => [...new Set(trips.map((t) => t.operatorName).filter(Boolean))],
    [trips]
  );

  // Get count of trips with female seats
  const hasFemaleSeatsCount = useMemo(
    () => trips.filter((t) => t.hasFemaleReservedSeats).length,
    [trips]
  );

  const maxPrice = useMemo(() => {
    const prices = trips.map((t) => getTripFare(t) || 0).filter(Boolean);
    return prices.length > 0 ? Math.ceil(Math.max(...prices)) : 5000;
  }, [trips, getTripFare]);

  const minPrice = useMemo(() => {
    const prices = trips.map((t) => getTripFare(t) || 0).filter(Boolean);
    return prices.length > 0 ? Math.floor(Math.min(...prices)) : 0;
  }, [trips, getTripFare]);

  const departureSlots = useMemo(() => {
    const times = trips
      .map((t) => {
        if (!t.departureTime) return null;
        const hour = parseInt(t.departureTime.split(":")[0]);
        if (hour < 6) return { label: "Night (00:00-06:00)", value: "night" };
        if (hour < 12) return { label: "Morning (06:00-12:00)", value: "morning" };
        if (hour < 18)
          return { label: "Afternoon (12:00-18:00)", value: "afternoon" };
        return { label: "Evening (18:00-24:00)", value: "evening" };
      })
      .filter(Boolean);
    return [...new Map(times.map((t) => [t.value, t])).values()];
  }, [trips]);

  const durationRanges = [
    { label: "Less than 3 hours", value: "0-3" },
    { label: "3 - 5 hours", value: "3-5" },
    { label: "5 - 8 hours", value: "5-8" },
    { label: "More than 8 hours", value: "8-24" },
  ];

  // Filtered lists based on search
  const filteredOperators = useMemo(() => {
    return operators.filter((op) =>
      op.toLowerCase().includes(searchTerms.operator.toLowerCase())
    );
  }, [operators, searchTerms.operator]);

  const filteredBusModels = useMemo(() => {
    return busModels.filter((model) =>
      model.toLowerCase().includes(searchTerms.busModel.toLowerCase())
    );
  }, [busModels, searchTerms.busModel]);

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

  const toggleGroup = (group) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters };

    if (filterType === "priceRange") {
      newFilters.priceRange = value;
    } else if (filterType === "femaleSeats") {
      newFilters.femaleSeats = value;
    } else if (Array.isArray(newFilters[filterType])) {
      if (newFilters[filterType].includes(value)) {
        newFilters[filterType] = newFilters[filterType].filter(
          (v) => v !== value
        );
      } else {
        newFilters[filterType] = [...newFilters[filterType], value];
      }
    }

    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    onFilterChange({
      busType: [],
      busModel: [],
      priceRange: [0, maxPrice],
      departureTime: [],
      operatorName: [],
      duration: [],
      femaleSeats: false,
    });
    setSearchTerms({ operator: "", busModel: "" });
  };

  const activeFilterCount = useMemo(() => {
    return (
      filters.busType.length +
      filters.busModel.length +
      filters.operatorName.length +
      filters.departureTime.length +
      filters.duration.length +
      (filters.femaleSeats ? 1 : 0) +
      (filters.priceRange[0] !== 0 || filters.priceRange[1] !== maxPrice ? 1 : 0)
    );
  }, [filters, maxPrice]);

  return (
    <aside className="h-screen overflow-y-auto border-r border-[#e7e5dc] bg-white p-5 max-[900px]:hidden w-80">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between sticky top-0 bg-white py-2 z-10">
        <h3 className="font-semibold text-ink">Filters</h3>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-orange hover:text-[#d97e3a] font-semibold"
          >
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Price Range */}
        <div>
          <button
            onClick={() => toggleGroup("price")}
            className="mb-2 flex w-full items-center justify-between font-semibold text-ink hover:text-orange"
          >
            <span>Price</span>
            <span className="text-lg">{expandedGroups.price ? "−" : "+"}</span>
          </button>
          {expandedGroups.price && (
            <div className="space-y-3 pl-2">
              <DualRangeSlider
                minValue={filters.priceRange[0]}
                maxValue={filters.priceRange[1]}
                minLimit={0}
                maxLimit={maxPrice}
                onChange={(range) => handleFilterChange("priceRange", range)}
              />
            </div>
          )}
        </div>

        {/* Departure Time */}
        {departureSlots.length > 0 && (
          <div>
            <button
              onClick={() => toggleGroup("departure")}
              className="mb-2 flex w-full items-center justify-between font-semibold text-ink hover:text-orange"
            >
              <span>Departure Time</span>
              <span className="text-lg">
                {expandedGroups.departure ? "−" : "+"}
              </span>
            </button>
            {expandedGroups.departure && (
              <div className="space-y-2 pl-2">
                {departureSlots.map((slot) => (
                  <label
                    key={slot.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.departureTime.includes(slot.value)}
                      onChange={() =>
                        handleFilterChange("departureTime", slot.value)
                      }
                      className="h-4 w-4 rounded border-[#c8cdc3] text-orange"
                    />
                    <span className="text-sm text-[#606a5d]">{slot.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Journey Duration */}
        <div>
          <button
            onClick={() => toggleGroup("duration")}
            className="mb-2 flex w-full items-center justify-between font-semibold text-ink hover:text-orange"
          >
            <span>Journey Duration</span>
            <span className="text-lg">
              {expandedGroups.duration ? "−" : "+"}
            </span>
          </button>
          {expandedGroups.duration && (
            <div className="space-y-2 pl-2">
              {durationRanges.map((range) => (
                <label
                  key={range.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.duration.includes(range.value)}
                    onChange={() => handleFilterChange("duration", range.value)}
                    className="h-4 w-4 rounded border-[#c8cdc3] text-orange"
                  />
                  <span className="text-sm text-[#606a5d]">{range.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Bus Type */}
        {busTypes.length > 0 && (
          <div>
            <button
              onClick={() => toggleGroup("busType")}
              className="mb-2 flex w-full items-center justify-between font-semibold text-ink hover:text-orange"
            >
              <span>Bus Type</span>
              {filters.busType.length > 0 && (
                <span className="text-xs font-mono bg-orange text-white px-2 py-0.5 rounded-full">
                  {filters.busType.length}
                </span>
              )}
              <span className="text-lg">
                {expandedGroups.busType ? "−" : "+"}
              </span>
            </button>
            {expandedGroups.busType && (
              <div className="space-y-2 pl-2">
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
            )}
          </div>
        )}

        {/* Bus Model */}
        {busModels.length > 0 && (
          <div>
            <button
              onClick={() => toggleGroup("busModel")}
              className="mb-2 flex w-full items-center justify-between font-semibold text-ink hover:text-orange"
            >
              <span>Bus Model</span>
              {filters.busModel.length > 0 && (
                <span className="text-xs font-mono bg-orange text-white px-2 py-0.5 rounded-full">
                  {filters.busModel.length}
                </span>
              )}
              <span className="text-lg">
                {expandedGroups.busModel ? "−" : "+"}
              </span>
            </button>
            {expandedGroups.busModel && (
              <div className="space-y-2 pl-2">
                <input
                  type="text"
                  placeholder="Search models..."
                  value={searchTerms.busModel}
                  onChange={(e) =>
                    setSearchTerms({ ...searchTerms, busModel: e.target.value })
                  }
                  className="mb-2 w-full rounded border border-[#e7e5dc] px-2 py-1.5 text-sm placeholder-muted focus:outline-none focus:ring-1 focus:ring-orange"
                />
                <div className="max-h-[200px] space-y-2 overflow-y-auto">
                  {filteredBusModels.length > 0 ? (
                    filteredBusModels.map((model) => (
                      <label
                        key={model}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.busModel.includes(model)}
                          onChange={() =>
                            handleFilterChange("busModel", model)
                          }
                          className="h-4 w-4 rounded border-[#c8cdc3] text-orange"
                        />
                        <span className="text-sm text-[#606a5d] truncate">
                          {model}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="text-xs text-muted py-2">No models found</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Operator */}
        {operators.length > 0 && (
          <div>
            <button
              onClick={() => toggleGroup("operator")}
              className="mb-2 flex w-full items-center justify-between font-semibold text-ink hover:text-orange"
            >
              <span>Operator</span>
              {filters.operatorName.length > 0 && (
                <span className="text-xs font-mono bg-orange text-white px-2 py-0.5 rounded-full">
                  {filters.operatorName.length}
                </span>
              )}
              <span className="text-lg">
                {expandedGroups.operator ? "−" : "+"}
              </span>
            </button>
            {expandedGroups.operator && (
              <div className="space-y-2 pl-2">
                <input
                  type="text"
                  placeholder="Search operators..."
                  value={searchTerms.operator}
                  onChange={(e) =>
                    setSearchTerms({ ...searchTerms, operator: e.target.value })
                  }
                  className="mb-2 w-full rounded border border-[#e7e5dc] px-2 py-1.5 text-sm placeholder-muted focus:outline-none focus:ring-1 focus:ring-orange"
                />
                <div className="max-h-[200px] space-y-2 overflow-y-auto">
                  {filteredOperators.length > 0 ? (
                    filteredOperators.map((op) => (
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
                    ))
                  ) : (
                    <p className="text-xs text-muted py-2">No operators found</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Female Reserved Seats */}
        {hasFemaleSeatsCount > 0 && (
          <div>
            <button
              onClick={() => toggleGroup("femaleSeats")}
              className="mb-2 flex w-full items-center justify-between font-semibold text-ink hover:text-orange"
            >
              <span>Women Safety</span>
              <span className="text-lg">
                {expandedGroups.femaleSeats ? "−" : "+"}
              </span>
            </button>
            {expandedGroups.femaleSeats && (
              <div className="space-y-2 pl-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.femaleSeats}
                    onChange={(e) =>
                      handleFilterChange("femaleSeats", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-[#c8cdc3] text-orange"
                  />
                  <span className="text-sm text-[#606a5d]">
                    Female reserved seats ({hasFemaleSeatsCount})
                  </span>
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="mt-8 border-t border-[#e7e5dc] pt-4">
          <p className="mb-2 text-xs font-mono text-muted">Active filters:</p>
          <div className="flex flex-wrap gap-2">
            {filters.busType.map((type) => (
              <span
                key={`bt-${type}`}
                className="inline-flex items-center gap-1 rounded-full bg-[#e8f3e0] px-2 py-1 text-xs font-semibold text-green"
              >
                {getBusTypeLabel(type)}
                <button
                  onClick={() => handleFilterChange("busType", type)}
                  className="hover:text-[#5a9e52]"
                >
                  ×
                </button>
              </span>
            ))}
            {filters.busModel.map((model) => (
              <span
                key={`bm-${model}`}
                className="inline-flex items-center gap-1 rounded-full bg-[#e8f3e0] px-2 py-1 text-xs font-semibold text-green"
              >
                {model.substring(0, 12)}...
                <button
                  onClick={() => handleFilterChange("busModel", model)}
                  className="hover:text-[#5a9e52]"
                >
                  ×
                </button>
              </span>
            ))}
            {filters.operatorName.map((op) => (
              <span
                key={`op-${op}`}
                className="inline-flex items-center gap-1 rounded-full bg-[#e8f3e0] px-2 py-1 text-xs font-semibold text-green"
              >
                {op.substring(0, 12)}...
                <button
                  onClick={() => handleFilterChange("operatorName", op)}
                  className="hover:text-[#5a9e52]"
                >
                  ×
                </button>
              </span>
            ))}
            {filters.femaleSeats && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f3e0] px-2 py-1 text-xs font-semibold text-green">
                Female seats
                <button
                  onClick={() => handleFilterChange("femaleSeats", false)}
                  className="hover:text-[#5a9e52]"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
