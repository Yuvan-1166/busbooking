/**
 * Ranked horizontal bar list (top routes / buses / operators).
 * Bars are sized relative to the leading item; each row carries a rank chip,
 * label, right-aligned value and optional detail line.
 */
export default function RankedBarChart({
  items = [],
  valueOf,
  labelOf,
  detailOf = null,
  formatValue = (value) => String(value),
  color = "bg-primary-500",
  limit = 6,
  emptyText = "No data for the selected range",
}) {
  const rows = items.slice(0, limit);

  if (rows.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-neutral-400">
        {emptyText}
      </p>
    );
  }

  const max = Math.max(...rows.map((item) => Number(valueOf(item)) || 0), 1);

  return (
    <ol className="flex flex-col gap-4">
      {rows.map((item, index) => {
        const value = Number(valueOf(item)) || 0;
        const width = Math.max((value / max) * 100, value > 0 ? 4 : 0);
        return (
          <li key={index}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-semibold ${
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
                <span className="truncate text-sm font-medium text-neutral-900">
                  {labelOf(item)}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-neutral-700">
                {formatValue(value)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
              <div
                className={`h-full rounded-full transition-all duration-300 ${color}`}
                style={{ width: `${width}%` }}
              />
            </div>
            {detailOf?.(item) && (
              <p className="mt-1 text-xs text-neutral-500">{detailOf(item)}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}