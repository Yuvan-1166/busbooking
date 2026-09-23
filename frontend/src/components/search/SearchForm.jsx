export default function SearchForm({
  locations,
  from,
  to,
  date,
  loading,
  searching,
  matchingRoute,
  onFromChange,
  onToChange,
  onDateChange,
  onSwap,
  onSubmit,
}) {
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <form
      className="card relative z-20 mx-auto max-w-full shadow-lg"
      aria-label="Search bus trips"
      onSubmit={onSubmit}
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Search Bus Tickets</h2>
        {matchingRoute && (
          <span className="badge badge-success">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Route available
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-[1fr_auto_1fr_1fr_auto] items-end gap-4 max-[900px]:grid-cols-[1fr_auto_1fr] max-[600px]:grid-cols-1">
        <div className="form-group mb-0">
          <label className="form-label">From</label>
          <select
            className="select"
            required
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
            disabled={loading}
          >
            <option value="">Select departure city</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
                {location.city ? `, ${location.city}` : ""}
              </option>
            ))}
          </select>
        </div>
        
        <button
          type="button"
          className="btn btn-ghost mb-2 h-10 w-10 shrink-0 p-0 max-[600px]:hidden"
          onClick={onSwap}
          aria-label="Swap locations"
          disabled={loading}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>
        
        <div className="form-group mb-0">
          <label className="form-label">To</label>
          <select
            className="select"
            required
            value={to}
            onChange={(event) => onToChange(event.target.value)}
            disabled={loading}
          >
            <option value="">Select arrival city</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
                {location.city ? `, ${location.city}` : ""}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group mb-0 max-[900px]:col-span-3 max-[600px]:col-span-1">
          <label className="form-label">Date</label>
          <input
            className="input"
            required
            type="date"
            min={minDate}
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
            disabled={loading}
          />
        </div>
        
        <button
          type="submit"
          className="btn btn-primary btn-lg mb-2 max-[900px]:col-span-3 max-[600px]:col-span-1 max-[600px]:w-full transition-smooth hover-scale disabled:opacity-50"
          disabled={searching || loading}
        >
          {searching ? (
            <span className="flex items-center gap-2 fade-in">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-l-transparent"></div>
              Searching...
            </span>
          ) : (
            <span className="flex items-center gap-2 transition-colors">
              Search Buses
              <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          )}
        </button>
      </div>
    </form>
  );
}
