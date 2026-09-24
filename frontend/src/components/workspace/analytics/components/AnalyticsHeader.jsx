import DateRangeFilter from "./DateRangeFilter";
import { formatFullDate } from "../../../../utils/format";

/**
 * Dashboard toolbar: page title, active range, admin scope selector and the
 * date-range controls.
 */
export default function AnalyticsHeader({
  isAdmin,
  range,
  onRangeChange,
  onPreset,
  operatorId,
  onOperatorChange,
  operators,
}) {
  return (
    <header className="card mb-6 flex flex-wrap items-end justify-between gap-4 p-5">
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="badge badge-info uppercase tracking-wider">Reports</span>
          <span className="text-xs text-neutral-400">
            {formatFullDate(range.from)} — {formatFullDate(range.to)}
          </span>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Analytics
        </h2>
        <p className="mt-1 max-w-xl text-sm text-neutral-500">
          {isAdmin
            ? "Platform-wide revenue, bookings and capacity insights."
            : "Revenue, bookings and capacity insights for your fleet."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {isAdmin && (
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-600">
            Scope
            <select
              className="select h-9 w-48"
              value={operatorId}
              onChange={(event) => onOperatorChange(event.target.value)}
            >
              <option value="all">All operators</option>
              {operators.map((operator) => (
                <option key={operator.id} value={String(operator.id)}>
                  {operator.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <DateRangeFilter
          range={range}
          onPreset={onPreset}
          onRangeChange={onRangeChange}
        />
      </div>
    </header>
  );
}