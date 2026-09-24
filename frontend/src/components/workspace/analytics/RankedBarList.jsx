/**
 * Horizontal ranked bar list (top routes / buses / operators).
 * Bars are sized relative to the top value across the given items.
 */
export default function RankedBarList({
  items = [],
  valueOf,
  labelOf,
  subLabelOf = null,
  formatter = (value) => String(value),
  accent = "bg-primary-500",
  limit = 6,
  emptyText = "No data for the selected range",
}) {
  const rows = items.slice(0, limit);

  if (rows.length === 0) {
    return (
      <p className="rounded-md bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-400">
        {emptyText}
      </p>
    );
  }

  const max = Math.max(...rows.map((item) => Number(valueOf(item)) || 0), 1);

  return (
    <ol className="space-y-3">
      {rows.map((item, index) => {
        const value = Number(valueOf(item)) || 0;
        const width = Math.max((value / max) * 100, value > 0 ? 3 : 0);
        return (
          <li key={`${labelOf(item)}-${index}`} className="flex items-center gap-3">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                index === 0
                  ? "bg-primary-600 text-white"
                  : index === 1
                    ? "bg-primary-100 text-primary-700"
                    : index === 2
                      ? "bg-primary-50 text-primary-600"
                      : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {index + 1}
            </span>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium text-neutral-900">
                  {labelOf(item)}
                </span>
                <span className="shrink-0 text-sm font-semibold text-neutral-700">
                  {formatter(value)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${accent}`}
                  style={{ width: `${width}%` }}
                />
              </div>
              {subLabelOf?.(item) && (
                <div className="mt-0.5 text-xs text-neutral-500">{subLabelOf(item)}</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}