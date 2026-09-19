import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import StateMessage from "../common/StateMessage";
import SearchForm from "./SearchForm";
import TripCard from "./TripCard";
import Pagination from "../common/Pagination";
import FilterSidebar from "./FilterSidebar";

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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Calculate max price from trips
  const maxPrice = useMemo(() => {
    const prices = trips.map((t) => getTripFare(t) || 0).filter(Boolean);
    return prices.length > 0 ? Math.ceil(Math.max(...prices)) : 5000;
  }, [trips, getTripFare]);

  const [filters, setFilters] = useState({
    busType: [],
    busModel: [],
    priceRange: [0, maxPrice],
    departureTime: [],
    operatorName: [],
    duration: [],
    femaleSeats: false,
  });

  // Update filter price range when max price changes
  useMemo(() => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      priceRange: [0, maxPrice],
    }));
  }, [maxPrice]);

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

      // Bus Model Filter
      if (
        filters.busModel.length > 0 &&
        !filters.busModel.includes(trip.busModel)
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

        if (hour < 6) timeSlot = "night";
        else if (hour < 12) timeSlot = "morning";
        else if (hour < 18) timeSlot = "afternoon";
        else timeSlot = "evening";

        if (!filters.departureTime.includes(timeSlot)) {
          return false;
        }
      }

      // Journey Duration Filter
      if (filters.duration.length > 0 && trip.duration) {
        const durationMatch = trip.duration.match(/(\d+)h\s*(\d+)?m?/);
        if (durationMatch) {
          const hours = parseInt(durationMatch[1]);
          const minutes = durationMatch[2] ? parseInt(durationMatch[2]) : 0;
          const totalHours = hours + minutes / 60;

          let durationRange = null;
          if (totalHours < 3) durationRange = "0-3";
          else if (totalHours < 5) durationRange = "3-5";
          else if (totalHours < 8) durationRange = "5-8";
          else durationRange = "8-24";

          if (!filters.duration.includes(durationRange)) {
            return false;
          }
        }
      }

      // Female Reserved Seats Filter
      if (filters.femaleSeats && !trip.hasFemaleReservedSeats) {
        return false;
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
    const resultsSection = document.getElementById("trips-container");
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <main id="top" className="min-h-screen bg-neutral-50">
      {/* Header with Search Form */}
      <section className="border-b border-neutral-200 bg-white px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <h1 className="mb-2 text-xl font-semibold text-neutral-900 sm:text-2xl">Search Results</h1>
            <p className="text-sm text-neutral-600">
              {matchingRoute ? `Route: ${matchingRoute.name}` : "Select your journey"}
            </p>
          </div>
          
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
        </div>
      </section>

      {/* Sidebar + Content Layout */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Mobile Filter Toggle */}
        <div className="mb-4 lg:hidden">
          <button
            className="btn btn-secondary w-full"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v6.586a1 1 0 01-1.447.894l-4-2A1 1 0 018 18.586v-4.586a1 1 0 00-.293-.707L1.293 7.293A1 1 0 011 6.586V4z" />
            </svg>
            Filters {filteredTrips.length !== trips.length ? `(${Object.values(filters).flat().filter(Boolean).length})` : ''}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar - Filters */}
          <aside className={`${mobileFiltersOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="sticky top-6">
              <FilterSidebar
                trips={trips}
                filters={filters}
                onFilterChange={setFilters}
                getTripFare={getTripFare}
              />
            </div>
          </aside>

          {/* Main Content */}
          <section id="trips-container" className="w-full">
          {loading ? (
            <div className="space-y-4">
              {/* Skeleton loading for trip cards */}
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`card fade-in stagger-${Math.min(i + 1, 4)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-neutral-200 skeleton-shimmer"></div>
                        <div className="h-4 w-32 rounded bg-neutral-200 skeleton-shimmer"></div>
                      </div>
                      <div className="mb-4 flex items-center gap-8">
                        <div className="text-center">
                          <div className="h-6 w-16 rounded bg-neutral-200 skeleton-shimmer mb-1"></div>
                          <div className="h-3 w-20 rounded bg-neutral-200 skeleton-shimmer"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-neutral-200 skeleton-shimmer"></div>
                          <div className="h-1 w-16 rounded bg-neutral-200 skeleton-shimmer"></div>
                          <div className="h-2 w-2 rounded-full bg-neutral-200 skeleton-shimmer"></div>
                        </div>
                        <div className="text-center">
                          <div className="h-6 w-16 rounded bg-neutral-200 skeleton-shimmer mb-1"></div>
                          <div className="h-3 w-20 rounded bg-neutral-200 skeleton-shimmer"></div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6 text-right">
                      <div className="h-8 w-20 rounded bg-neutral-200 skeleton-shimmer mb-2"></div>
                      <div className="h-9 w-24 rounded bg-neutral-200 skeleton-shimmer"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : trips.length ? (
            <>
              {/* Results Summary */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">
                    <span className="font-semibold text-neutral-900">{filteredTrips.length}</span> of{" "}
                    <span className="font-semibold text-neutral-900">{trips.length}</span> buses available
                  </p>
                  {date && (
                    <p className="mt-1 text-xs text-neutral-500">
                      Travel date: {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
                {filteredTrips.length !== trips.length && (
                  <button
                    onClick={() => setFilters({
                      busType: [],
                      busModel: [],
                      priceRange: [0, maxPrice],
                      departureTime: [],
                      operatorName: [],
                      duration: [],
                      femaleSeats: false,
                    })}
                    className="btn-ghost text-sm"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {/* Trip Cards */}
              {paginatedTrips.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {paginatedTrips.map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={{ ...trip, startingFare: getTripFare(trip) }}
                        onSelect={() => onTripSelect(trip)}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-8">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        isLoading={searching}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="card text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                    <svg className="h-8 w-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-neutral-900">No buses match your filters</h3>
                  <p className="mb-4 text-sm text-neutral-600">Try adjusting your filters or search criteria</p>
                  <button
                    onClick={() => setFilters({
                      busType: [],
                      busModel: [],
                      priceRange: [0, maxPrice],
                      departureTime: [],
                      operatorName: [],
                      duration: [],
                      femaleSeats: false,
                    })}
                    className="btn btn-secondary"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="card text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <svg className="h-8 w-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                {searching ? "Searching for buses..." : "No buses found"}
              </h3>
              <p className="text-sm text-neutral-600">
                {searching
                  ? "Please wait while we fetch available buses"
                  : "No trips available for the selected route and date. Try different search criteria."}
              </p>
            </div>
          )}
          </section>
        </div>
      </div>
    </main>
  );
}
