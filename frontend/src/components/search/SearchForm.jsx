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
  const fieldClass =
    "grid gap-1.5 text-[10px] uppercase tracking-[.07em] text-muted";
  const controlClass =
    "w-full border-0 border-b border-line bg-transparent py-2.5 text-sm font-semibold text-ink outline-0";
  
  return (
    <form
      className="relative mx-auto max-w-[1168px] bg-paper px-[25px] pb-[25px] pt-[21px] shadow-[0_14px_30px_rgba(48,53,43,.08)]"
      aria-label="Search bus trips"
      onSubmit={onSubmit}
    >
      <div className="mb-[18px] flex justify-between font-mono text-[11px] tracking-[.04em] text-ink max-[600px]:flex-col max-[600px]:gap-2">
        <span>Search trips</span>
        <span className={`text-[10px] ${matchingRoute ? "text-green" : "text-muted"}`}>
          <i className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${matchingRoute ? "bg-[#75a86e]" : "bg-[#c8cdc3]"}`}></i>
          {matchingRoute ? "Route found" : "Select locations"}
        </span>
      </div>
      <div className="grid grid-cols-[1.1fr_34px_1.1fr_1fr_1.05fr] items-end gap-3 max-[900px]:grid-cols-[1fr_30px_1fr_1fr] max-[600px]:grid-cols-[1fr_30px_1fr]">
        <label className={fieldClass}>
          <span>Leaving from</span>
          <select
            className={controlClass}
            required
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
          >
            <option value="">Select location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
                {location.city ? `, ${location.city}` : ""}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="mb-0.5 h-8 w-8 rounded-full border border-line bg-paper text-lg text-orange hover:bg-[#f9f9f7] transition-colors"
          onClick={onSwap}
          aria-label="Swap departure and destination"
        >
          ⇄
        </button>
        <label className={fieldClass}>
          <span>Going to</span>
          <select
            className={controlClass}
            required
            value={to}
            onChange={(event) => onToChange(event.target.value)}
          >
            <option value="">Select location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
                {location.city ? `, ${location.city}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className={fieldClass}>
          <span>Travel date</span>
          <input
            className={controlClass}
            required
            type="date"
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
          />
        </label>
        <button
          className="border-0 bg-orange px-[17px] py-3.5 text-left font-bold text-white disabled:opacity-45 hover:bg-[#d97e3a] transition-colors max-[600px]:col-span-3"
        >
          {searching ? "Searching..." : "Search"}{" "}
          <span className="float-right text-lg">→</span>
        </button>
      </div>
    </form>
  );
}
