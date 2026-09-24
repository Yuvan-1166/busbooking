/**
 * Lightweight, dependency-free data table for analytics breakdowns.
 *
 * @param {Array<object>} rows
 * @param {Array<{ key: string, label: string, align?: "left"|"right", render?: (row) => ReactNode }>} columns
 */
export default function PerformanceTable({ rows = [], columns = [], emptyText = "No data" }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-400">
        {emptyText}
      </p>
    );
  }

  const alignClass = (align) =>
    align === "right" ? "text-right" : "text-left";

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-200">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 ${alignClass(column.align)}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.key ?? index}
              className="border-b border-neutral-100 transition-colors hover:bg-neutral-50"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-3 py-2.5 text-neutral-700 ${alignClass(column.align)}`}
                >
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}