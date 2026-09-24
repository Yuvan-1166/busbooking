import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../../api";
import MetricCard from "../MetricCard";
import { LoadingPage } from "../../common";
import DateRangeFilter from "./DateRangeFilter";
import TrendChart from "./TrendChart";
import RankedBarList from "./RankedBarList";
import PerformanceTable from "./PerformanceTable";
import {
  formatCount,
  formatCurrency,
  formatFullDate,
  formatPercent,
} from "../../../utils/format";

const toISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const defaultRange = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 29);
  return { from: toISO(from), to: toISO(to) };
};

const revenueFormatter = (value) => formatCurrency(value, true);
const compactCount = (value) => formatCount(value);

const accent = {
  primary: "bg-primary-500",
  success: "bg-success-500",
  info: "bg-info-500",
  warning: "bg-warning-500",
};

const icons = {
  currency: {
    color: "success",
    node: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  ticket: {
    color: "primary",
    node: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
  seat: {
    color: "info",
    node: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16v2H4zm0 5h16v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6zm2-7h12a2 2 0 012 2v1H4V6a2 2 0 012-2z" />
      </svg>
    ),
  },
  cancel: {
    color: "warning",
    node: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  trip: {
    color: "primary",
    node: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  bus: {
    color: "info",
    node: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  user: {
    color: "success",
    node: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  operator: {
    color: "warning",
    node: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
};

export default function AnalyticsPage({ role = "operator" }) {
  const isAdmin = role === "admin";
  const [range, setRange] = useState(defaultRange);
  const [operatorId, setOperatorId] = useState("all");
  const [operators, setOperators] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    api
      .getOperators()
      .then(setOperators)
      .catch(() => setOperators([]));
  }, [isAdmin]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const effectiveOperator =
        isAdmin && operatorId !== "all" ? Number(operatorId) : undefined;
      const payload = await api.getAnalytics(range.from, range.to, effectiveOperator);
      setData(payload);
    } catch (loadError) {
      setError(loadError.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, operatorId, range]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = data?.summary;

  const kpis = useMemo(() => {
    if (!summary) return [];

    const cards = [
      {
        label: "Total Revenue",
        value: formatCurrency(summary.totalRevenue, true),
        detail: `across ${formatCount(summary.totalBookings)} bookings`,
        color: icons.currency.color,
        icon: icons.currency.node,
      },
      {
        label: "Bookings",
        value: formatCount(summary.totalBookings),
        detail: `${summary.totalBookings > 0 ? formatCount(summary.totalBookings) : 0} confirmed`,
        color: icons.ticket.color,
        icon: icons.ticket.node,
      },
      {
        label: "Avg Occupancy",
        value: formatPercent(summary.averageOccupancy),
        detail: `${formatCount(summary.totalTickets)} tickets issued`,
        color: icons.seat.color,
        icon: icons.seat.node,
      },
      {
        label: "Cancellations",
        value: formatCount(summary.totalCancellations),
        detail: `${formatCurrency(summary.refundedAmount, true)} refunded`,
        color: icons.cancel.color,
        icon: icons.cancel.node,
      },
      {
        label: "Trips",
        value: formatCount(summary.totalTrips),
        detail: `${summary.completedTrips} completed · ${summary.scheduledTrips} scheduled`,
        color: icons.trip.color,
        icon: icons.trip.node,
      },
      {
        label: "Fleet",
        value: formatCount(summary.totalBuses),
        detail: `${formatCount(summary.totalSeats)} seats total`,
        color: icons.bus.color,
        icon: icons.bus.node,
      },
    ];

    if (isAdmin) {
      cards.push(
        {
          label: "New Users",
          value: formatCount(summary.newUsers ?? 0),
          detail: `${formatCount(summary.totalUsers ?? 0)} total users`,
          color: icons.user.color,
          icon: icons.user.node,
        },
        {
          label: "Operators",
          value: formatCount(summary.totalOperators ?? 0),
          detail: `${formatCount(summary.totalRoutes ?? 0)} routes live`,
          color: icons.operator.color,
          icon: icons.operator.node,
        },
      );
    }
    return cards;
  }, [isAdmin, summary]);

  const trendModes = useMemo(
    () => [
      { key: "bookings", label: "Bookings" },
      { key: "passengers", label: "Passengers" },
      { key: "revenue", label: "Revenue" },
    ],
    [],
  );
  const [trendMode, setTrendMode] = useState("bookings");
  const trendFormatter =
    trendMode === "revenue" ? revenueFormatter : compactCount;

  const routeColumns = useMemo(
    () => [
      {
        key: "routeName",
        label: "Route",
        render: (row) => <span className="font-medium text-neutral-900">{row.routeName}</span>,
      },
      { key: "tripCount", label: "Trips", align: "right", render: (row) => formatCount(row.tripCount) },
      { key: "bookingCount", label: "Bookings", align: "right", render: (row) => formatCount(row.bookingCount) },
      { key: "passengerCount", label: "Passengers", align: "right", render: (row) => formatCount(row.passengerCount) },
      {
        key: "occupancyRate",
        label: "Occupancy",
        align: "right",
        render: (row) => formatPercent(row.occupancyRate),
      },
      { key: "revenue", label: "Revenue", align: "right", render: (row) => formatCurrency(row.revenue) },
    ],
    [],
  );

  const busColumns = useMemo(
    () => [
      {
        key: "registrationNumber",
        label: "Bus",
        render: (row) => (
          <span className="font-medium text-neutral-900">{row.registrationNumber}</span>
        ),
      },
      { key: "tripCount", label: "Trips", align: "right", render: (row) => formatCount(row.tripCount) },
      { key: "bookingCount", label: "Bookings", align: "right", render: (row) => formatCount(row.bookingCount) },
      { key: "passengerCount", label: "Passengers", align: "right", render: (row) => formatCount(row.passengerCount) },
      {
        key: "occupancyRate",
        label: "Occupancy",
        align: "right",
        render: (row) => formatPercent(row.occupancyRate),
      },
      { key: "revenue", label: "Revenue", align: "right", render: (row) => formatCurrency(row.revenue) },
    ],
    [],
  );

  const operatorColumns = useMemo(
    () => [
      {
        key: "operatorName",
        label: "Operator",
        render: (row) => <span className="font-medium text-neutral-900">{row.operatorName}</span>,
      },
      { key: "busCount", label: "Buses", align: "right", render: (row) => formatCount(row.busCount) },
      { key: "tripCount", label: "Trips", align: "right", render: (row) => formatCount(row.tripCount) },
      { key: "bookingCount", label: "Bookings", align: "right", render: (row) => formatCount(row.bookingCount) },
      { key: "passengerCount", label: "Passengers", align: "right", render: (row) => formatCount(row.passengerCount) },
      {
        key: "occupancyRate",
        label: "Occupancy",
        align: "right",
        render: (row) => formatPercent(row.occupancyRate),
      },
      { key: "revenue", label: "Revenue", align: "right", render: (row) => formatCurrency(row.revenue) },
    ],
    [],
  );

  if (loading) {
    return (
      <LoadingPage
        message="Loading Analytics"
        subMessage="Aggregating bookings, trips, and revenue"
        showLogo={false}
      />
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {error}
        <button type="button" className="btn btn-sm btn-secondary ml-4" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-6 py-6">
      {/* Header + filters */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900">Analytics</h2>
          <p className="mt-1 text-sm text-neutral-500">
            {formatFullDate(data?.from)} – {formatFullDate(data?.to)}
            {isAdmin && operatorId !== "all" ? " · filtered to one operator" : ""}
          </p>
        </div>
        <DateRangeFilter
          from={range.from}
          to={range.to}
          onChange={(from, to) => setRange({ from, to })}
        />
      </div>

      {/* Operator filter (admin only) */}
      {isAdmin && (
        <label className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600">
          Operator scope
          <select
            className="select h-9"
            value={operatorId}
            onChange={(e) => setOperatorId(e.target.value)}
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

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <MetricCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Trend chart */}
      <div className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Bookings & Revenue Trend</h3>
            <p className="text-xs text-neutral-500">Daily confirmed bookings and collections</p>
          </div>
          <div className="flex rounded-lg border border-neutral-200 bg-neutral-50 p-1">
            {trendModes.map((mode) => (
              <button
                key={mode.key}
                type="button"
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  trendMode === mode.key
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                onClick={() => setTrendMode(mode.key)}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
        <TrendChart
          data={data?.trend ?? []}
          valueKey={trendMode}
          formatter={trendFormatter}
        />
      </div>

      {/* User growth (admin only) */}
      {isAdmin && (
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">New User Registrations</h3>
            <p className="text-xs text-neutral-500">Accounts created per day</p>
          </div>
          <TrendChart data={data?.userGrowth ?? []} valueKey="count" formatter={compactCount} />
        </div>
      )}

      {/* Ranked lists */}
      <div className={`grid gap-6 ${isAdmin ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        <RankedPanel title="Top Routes" subtitle="By revenue">
          <RankedBarList
            items={data?.routePerformance ?? []}
            valueOf={(row) => row.revenue}
            labelOf={(row) => row.routeName}
            subLabelOf={(row) => `${formatCount(row.tripCount)} trips · ${formatPercent(row.occupancyRate)} occupancy`}
            formatter={revenueFormatter}
            accent={accent.primary}
          />
        </RankedPanel>
        <RankedPanel title="Top Buses" subtitle="By revenue">
          <RankedBarList
            items={data?.busPerformance ?? []}
            valueOf={(row) => row.revenue}
            labelOf={(row) => row.registrationNumber}
            subLabelOf={(row) => `${formatCount(row.tripCount)} trips · ${formatPercent(row.occupancyRate)} occupancy`}
            formatter={revenueFormatter}
            accent={accent.success}
          />
        </RankedPanel>
        {isAdmin && (
          <RankedPanel title="Top Operators" subtitle="By revenue">
            <RankedBarList
              items={data?.operatorPerformance ?? []}
              valueOf={(row) => row.revenue}
              labelOf={(row) => row.operatorName}
              subLabelOf={(row) => `${formatCount(row.busCount)} buses · ${formatCount(row.tripCount)} trips`}
              formatter={revenueFormatter}
              accent={accent.info}
            />
          </RankedPanel>
        )}
      </div>

      {/* Detailed tables */}
      <div className="card p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">Route Performance</h3>
          <p className="text-xs text-neutral-500">Aggregated across the selected range</p>
        </div>
        <PerformanceTable rows={data?.routePerformance ?? []} columns={routeColumns} />
      </div>

      <div className="card p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">Bus Performance</h3>
          <p className="text-xs text-neutral-500">Aggregated across the selected range</p>
        </div>
        <PerformanceTable rows={data?.busPerformance ?? []} columns={busColumns} />
      </div>

      {isAdmin && (
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Operator Performance</h3>
            <p className="text-xs text-neutral-500">Aggregated across the selected range</p>
          </div>
          <PerformanceTable rows={data?.operatorPerformance ?? []} columns={operatorColumns} />
        </div>
      )}
    </section>
  );
}

function RankedPanel({ title, subtitle, children }) {
  return (
    <div className="card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        <p className="text-xs text-neutral-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}