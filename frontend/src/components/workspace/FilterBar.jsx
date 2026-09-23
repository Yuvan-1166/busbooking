export default function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  selects = [],
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onClear,
  resultCount,
  resultLabel = "results",
}) {
  const hasActiveFilters =
    (search && search.trim() !== "") ||
    selects.some((select) => select.value) ||
    dateFrom ||
    dateTo;

  return (
    <div className="card mb-6 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="form-group mb-0 min-w-[220px] flex-1">
          <label className="form-label">Search</label>
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="input !pl-9"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {selects.map((select) => (
          <div key={select.label} className="form-group mb-0 min-w-[150px]">
            <label className="form-label">{select.label}</label>
            <select
              className="select"
              value={select.value}
              onChange={(e) => select.onChange(e.target.value)}
            >
              <option value="">All {select.label}</option>
              {select.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {(dateFrom !== undefined || dateTo !== undefined) && (
          <>
            <div className="form-group mb-0 min-w-[150px]">
              <label className="form-label">From Date</label>
              <input
                type="date"
                className="input"
                value={dateFrom}
                onChange={(e) => onDateFromChange?.(e.target.value)}
              />
            </div>
            <div className="form-group mb-0 min-w-[150px]">
              <label className="form-label">To Date</label>
              <input
                type="date"
                className="input"
                value={dateTo}
                onChange={(e) => onDateToChange?.(e.target.value)}
              />
            </div>
          </>
        )}

        {hasActiveFilters && (
          <button type="button" onClick={onClear} className="btn-ghost">
            Clear Filters
          </button>
        )}
      </div>
      <p className="mt-3 text-xs text-neutral-500">
        Showing{" "}
        <span className="font-semibold text-neutral-700">{resultCount}</span>{" "}
        {resultLabel}
      </p>
    </div>
  );
}