import { useNavigate } from "react-router-dom";
import StateMessage from "../common/StateMessage";
import SearchForm from "./SearchForm";
import TripCard from "./TripCard";

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

      <section className="mx-auto mb-20 mt-12 max-w-[1168px] px-6 max-[600px]:mt-8">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3 max-[600px]:flex-wrap">
            <p className="font-mono text-[10px] tracking-[.13em] text-green">
              {date || "SELECT A DATE"}
            </p>
            {matchingRoute && (
              <span className="inline-block rounded-full bg-[#e8f3e0] px-3 py-1 font-mono text-[10px] font-semibold text-green">
                Route: {matchingRoute.name}
              </span>
            )}
          </div>
          <h2 className="m-0 font-display text-[32px] font-semibold tracking-[-.03em] text-ink max-[600px]:text-[24px]">
            {matchingRoute ? matchingRoute.name : "Search for a route"}
          </h2>
        </div>

        {loading ? (
          <StateMessage>Loading locations and routes...</StateMessage>
        ) : trips.length ? (
          <>
            <div className="mb-6 flex items-center gap-3 font-mono text-[10px] uppercase text-muted">
              <span className="rounded-full bg-[#e8f3e0] px-3 py-1.5 font-semibold text-green">
                {trips.length} trips available
              </span>
            </div>
            <div className="grid gap-3">
              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={{ ...trip, startingFare: getTripFare(trip) }}
                  onSelect={() => onTripSelect(trip)}
                />
              ))}
            </div>
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
