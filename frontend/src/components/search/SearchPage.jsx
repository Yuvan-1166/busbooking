import StateMessage from "../common/StateMessage";
import SearchForm from "./SearchForm";
import TripCard from "./TripCard";

export default function SearchPage({
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
  return (
    <main id="top">
      <section className="relative mx-auto min-h-[286px] max-w-[1240px] overflow-hidden rounded-[3px] bg-[#dce5d5] px-[34px] pb-[38px] pt-[53px] max-[600px]:min-h-[390px] max-[600px]:px-6 max-[600px]:py-[42px]">
        <div className="relative z-[2]">
          <p className="mb-3.5 font-mono text-[10px] tracking-[.13em] text-green">
            TRIP SEARCH
          </p>
          <h1 className="mb-3.5 font-display text-[56px] font-semibold leading-[.95] tracking-[-.045em] text-ink max-[600px]:text-[45px]">
            Find a<br />
            <em className="text-orange">trip.</em>
          </h1>
          <p className="max-w-[270px] text-sm leading-6 text-[#606a5d]">
            Search trips and choose an available seat.
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
        onFromChange={onFromChange}
        onToChange={onToChange}
        onDateChange={onDateChange}
        onSwap={onSwap}
        onSubmit={onSubmit}
      />
      <section className="mx-auto mb-20 mt-[67px] max-w-[1168px]" id="results">
        <div className="mb-6">
          <p className="mb-3.5 font-mono text-[10px] tracking-[.13em] text-green">
            {date || "SELECT A DATE"}
          </p>
          <h2 className="m-0 font-display text-[29px] font-semibold tracking-[-.03em] text-ink max-[600px]:text-[23px]">
            {matchingRoute ? matchingRoute.name : "Search for a route"}
          </h2>
        </div>
        <div className="mb-[22px] flex gap-6 font-mono text-[10px] uppercase text-muted">
          <span>
            <strong className="mr-1.5 text-base text-ink">
              {locations.length}
            </strong>{" "}
            locations
          </span>
          <span>
            <strong className="mr-1.5 text-base text-ink">
              {routes.length}
            </strong>{" "}
            routes
          </span>
          <span>
            <strong className="mr-1.5 text-base text-ink">
              {routeStops.length}
            </strong>{" "}
            route stops
          </span>
        </div>
        {loading ? (
          <StateMessage>Loading locations and routes...</StateMessage>
        ) : trips.length ? (
          <div className="grid gap-3">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={{ ...trip, startingFare: getTripFare(trip) }}
                onSelect={() => onTripSelect(trip)}
              />
            ))}
          </div>
        ) : (
          <StateMessage>
            {searching
              ? "Fetching trips..."
              : "No trips loaded. Choose locations and search."}
          </StateMessage>
        )}
      </section>
    </main>
  );
}
