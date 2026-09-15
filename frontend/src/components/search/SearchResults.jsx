import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import StateMessage from "../common/StateMessage";
import SearchForm from "./SearchForm";
import TripCard from "./TripCard";
import Pagination from "../common/Pagination";
import TripFilters from "./TripFilters";

const TRIPS_PER_PAGE = 8;

export default function SearchResults({
  locations,
  routes,
  routeStops,
  availableLocations,
  from,
  to,
  date,
  loading,
  searching,
  trips,
  matchingRoute,
  onFromChange,
  onToChange,
  onDateChange,
  onSwap,
  onSubmit,
  onTripSelect,
  getTripFare,
}) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    busType: [],
    priceRange: [0, 5000],
    departureTime: [],
    operatorName: [],
  });

  // Filter trips based on active filters
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      // Bus Type Filter
      if (
        filters.busType.length > 0 &&
        !filters.busType.includes(trip.busType)
      ) {
        return false;
      }

      // Operator Filter
      if (
        filters.operatorName.length > 0 &&
        !filters.operatorName.includes(trip.operatorName)
      ) {
        return false;
      }

      // Price Range Filter
      const tripFare = getTripFare(trip);
      if (
        tripFare &&
        (tripFare < filters.priceRange[0] || tripFare > filters.priceRange[1])
      ) {
        return false;
      }

      // Departure Time Filter
      if (filters.departureTime.length > 0 && trip.departureTime) {
        const hour = parseInt(trip.departureTime.split(":")[0]);
        let timeSlot = null;

        if (hour < 6) timeSlot = "Night (00:00-06:00)";
        else if (hour < 12) timeSlot = "Morning (06:00-12:00)";
        else if (hour < 18) timeSlot = "Afternoon (12:00-18:00)";
        else timeSlot = "Evening (18:00-24:00)";

        if (!filters.departureTime.includes(timeSlot)) {
          return false;
        }
      }

      return true;
    });
  }, [trips, filters, getTripFare]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [filteredTrips.length]);

  // Calculate pagination for filtered trips
  const totalPages = useMemo(
    () => Math.ceil(filteredTrips.length / TRIPS_PER_PAGE),
    [filteredTrips.length]
  );

  const paginatedTrips = useMemo(() => {
    const startIndex = (currentPage - 1) * TRIPS_PER_PAGE;
    const endIndex = startIndex + TRIPS_PER_PAGE;
    return filteredTrips.slice(startIndex, endIndex);
  }, [filteredTrips, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const resultsSection = document.getElementById("results");
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main id="top">
      <section className="relative mx-auto min-h-[240px] max-w-[1240px] overflow-hidden rounded-[3px] bg-[#dce5d5] px-[34px] pb-[32px] pt-[42px] max-[600px]:min-h-[290px] max-[600px]:px-6 max-[600px]:py-[32px]">
        <div className="relative z-[2]">
          <p className="mb-3.5 font-mono text-[10px] tracking-[.13em] text-green">
            SEARCH RESULTS
          </p>
          <h1 className="mb-3.5 font-display text-[48px] font-semibold leading-[1] tracking-[-.045em] text-ink max-[600px]:text-[36px]">
            Available
            <br />
            <em className="text-orange">trips</em>
          </h1>
          <p className="mt-4 max-w-[320px] text-sm leading-6 text-[#606a5d]">
            Showing available buses for your selected route and date.
          </p>
        </div>
      </section>

      <SearchForm
        locations={availableLocations}
        from={from}
        to={to}
        date={date}
        loading={loading}
        searching={searching}
        matchingRoute={matchingRoute}
        onFromChange={onFromChange}
        onToChange={onToChange}
        onDateChange={onDateChange}
        onSwap={onSwap}
        onSubmit={onSubmit}
      />

      <section className="mx-auto mb-20 mt-12 max-w-[1168px] px-6 max-[600px]:mt-8" id="results">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3 max-[600px]:flex-wrap">
            <p className="font-mono text-[10px] tracking-[.13em] text-green font-semibold">
              {date || "SELECT A DATE"}
            </p>
            {matchingRoute && (
              <span className="inline-block rounded-full bg-[#e8f3e0] px-3 py-1 font-mono text-[10px] font-semibold text-green">
                {matchingRoute.name}
              </span>
            )}
          </div>
          <h2 className="m-0 font-display text-[32px] font-semibold tracking-[-.03em] text-ink max-[600px]:text-[24px]">
            {matchingRoute ? "Available Trips" : "Search for a route"}
          </h2>
        </div>

        {loading ? (
          <StateMessage>Loading locations and routes...</StateMessage>
        ) : trips.length ? (
          <>
            {/* Filters */}
            <TripFilters
              trips={trips}
              onFiltersChange={setFilters}
              getTripFare={getTripFare}
            />

            {/* Results Summary */}
            <div className="mb-6 flex items-center justify-between max-[600px]:flex-col max-[600px]:items-start max-[600px]:gap-2">
              <div className="flex items-center gap-3 max-[600px]:flex-col max-[600px]:items-start">
                <div className="inline-block rounded-full bg-[#e8f0e3] px-4 py-2 font-mono text-[11px] font-semibold text-green">
                  {trips.length} {trips.length === 1 ? "trip" : "trips"} total
                </div>
                {filteredTrips.length !== trips.length && (
                  <div className="inline-block rounded-full bg-[#fff4e6] px-4 py-2 font-mono text-[11px] font-semibold text-[#d97e3a]">
                    {filteredTrips.length} showing
                  </div>
                )}
              </div>
              {totalPages > 1 && (
                <div className="text-right text-sm text-muted font-mono max-[600px]:text-left">
                  {paginatedTrips.length > 0 && (
                    <>
                      Showing {(currentPage - 1) * TRIPS_PER_PAGE + 1}–
                      {Math.min(currentPage * TRIPS_PER_PAGE, filteredTrips.length)}{" "}
                      of {filteredTrips.length}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Trip Cards */}
            {paginatedTrips.length > 0 ? (
              <>
                <div className="grid gap-4 mt-8 mb-8">
                  {paginatedTrips.map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={{ ...trip, startingFare: getTripFare(trip) }}
                      onSelect={() => onTripSelect(trip)}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    isLoading={searching}
                  />
                )}
              </>
            ) : (
              <StateMessage>
                No trips match your filters. Try adjusting your criteria.
              </StateMessage>
            )}
          </>
        ) : (
          <StateMessage>
            {searching
              ? "Fetching trips..."
              : "No trips available for the selected route and date. Try adjusting your search criteria."}
          </StateMessage>
        )}
      </section>
    </main>
  );
}
