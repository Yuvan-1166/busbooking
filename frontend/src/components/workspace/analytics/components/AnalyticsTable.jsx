const alignClass = (align) => (align === "right" ? "text-right" : "text-left");

/**
 * Polished analytics table: bordered container, sticky-style header, tabular
 * numerics and hover states. Numeric columns should pass `align: "right"`.
 *
 * @param {Array<object>} rows
 * @param {Array<{ key, label, align?, render? }>} columns
 */
export default function AnalyticsTable({
  rows = [],
  columns = [],
  emptyText = "No data for the selected period",
}) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-neutral-400">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-neutral-50/80">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`whitespace-nowrap border-b border-neutral-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 ${alignClass(column.align)}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row, index) => (
            <tr
              key={row.key ?? index}
              className="transition-colors hover:bg-primary-50/40"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`whitespace-nowrap px-4 py-3 tabular-nums ${alignClass(column.align)}`}
                >
                  {column.render
                    ? column.render(row)
                    : (row[column.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}