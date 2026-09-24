import { useMemo, useState } from "react";
import { useAnalytics } from "./useAnalytics";
import AnalyticsHeader from "./components/AnalyticsHeader";
import KpiGrid from "./components/KpiGrid";
import ChartCard from "./components/ChartCard";
import TrendChart from "./components/TrendChart";
import RankedBarChart from "./components/RankedBarChart";
import PerformancePanel from "./components/PerformancePanel";
import AnalyticsSkeleton from "./components/AnalyticsSkeleton";
import SegmentedControl from "./components/SegmentedControl";
import {
  formatCount,
  formatCurrency,
  formatPercent,
} from "../../../utils/format";

const revenueFormatter = (value) => formatCurrency(value, true);
const countFormatter = (value) => formatCount(value);

const TREND_MODES = [
  { key: "bookings", label: "Bookings", formatter: countFormatter, valueLabel: "Bookings" },
  { key: "passengers", label: "Passengers", formatter: countFormatter, valueLabel: "Passengers" },
  { key: "revenue", label: "Revenue", formatter: revenueFormatter, valueLabel: "Revenue" },
];

const ICONS = {
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

const routeColumns = [
  {
    key: "routeName",
    label: "Route",
    render: (row) => <span className="font-medium text-neutral-900">{row.routeName}</span>,
  },
  { key: "tripCount", label: "Trips", align: "right", render: (row) => formatCount(row.tripCount) },
  { key: "bookingCount", label: "Bookings", align: "right", render: (row) => formatCount(row.bookingCount) },
  { key: "passengerCount", label: "Passengers", align: "right", render: (row) => formatCount(row.passengerCount) },
  { key: "occupancyRate", label: "Occupancy", align: "right", render: (row) => formatPercent(row.occupancyRate) },
  { key: "revenue", label: "Revenue", align: "right", render: (row) => formatCurrency(row.revenue) },
];

const busColumns = [
  {
    key: "registrationNumber",
    label: "Bus",
    render: (row) => (
      <div>
        <div className="font-medium text-neutral-900">{row.registrationNumber}</div>
        <div className="text-xs text-neutral-500">{row.model}</div>
      </div>
    ),
  },
  { key: "tripCount", label: "Trips", align: "right", render: (row) => formatCount(row.tripCount) },
  { key: "bookingCount", label: "Bookings", align: "right", render: (row) => formatCount(row.bookingCount) },
  { key: "passengerCount", label: "Passengers", align: "right", render: (row) => formatCount(row.passengerCount) },
  { key: "occupancyRate", label: "Occupancy", align: "right", render: (row) => formatPercent(row.occupancyRate) },
  { key: "revenue", label: "Revenue", align: "right", render: (row) => formatCurrency(row.revenue) },
];

const operatorColumns = [
  {
    key: "operatorName",
    label: "Operator",
    render: (row) => <span className="font-medium text-neutral-900">{row.operatorName}</span>,
  },
  { key: "busCount", label: "Buses", align: "right", render: (row) => formatCount(row.busCount) },
  { key: "tripCount", label: "Trips", align: "right", render: (row) => formatCount(row.tripCount) },
  { key: "bookingCount", label: "Bookings", align: "right", render: (row) => formatCount(row.bookingCount) },
  { key: "passengerCount", label: "Passengers", align: "right", render: (row) => formatCount(row.passengerCount) },
  { key: "occupancyRate", label: "Occupancy", align: "right", render: (row) => formatPercent(row.occupancyRate) },
  { key: "revenue", label: "Revenue", align: "right", render: (row) => formatCurrency(row.revenue) },
];

const routeDetail = (row) =>
  `${formatCount(row.tripCount)} trips · ${formatPercent(row.occupancyRate)} occupancy`;
const busDetail = (row) =>
  `${formatCount(row.tripCount)} trips · ${formatPercent(row.occupancyRate)} occupancy`;
const operatorDetail = (row) =>
  `${formatCount(row.busCount)} buses · ${formatCount(row.tripCount)} trips`;

export default function AnalyticsPage({ role = "operator" }) {
  const {
    isAdmin,
    range,
    setRange,
    setPreset,
    operatorId,
    setOperatorId,
    operators,
    data,
    loading,
    error,
    reload,
  } = useAnalytics(role);

  const [trendKey, setTrendKey] = useState("bookings");
  const trendMode = TREND_MODES.find((mode) => mode.key === trendKey) ?? TREND_MODES[0];

  const summary = data?.summary;

  const kpis = useMemo(() => {
    if (!summary) return [];

    const core = [
      {
        label: "Total Revenue",
        value: formatCurrency(summary.totalRevenue, true),
        detail: `across ${formatCount(summary.totalBookings)} bookings`,
        icon: ICONS.currency.node,
        color: ICONS.currency.color,
      },
      {
        label: "Bookings",
        value: formatCount(summary.totalBookings),
        detail: `${formatCount(summary.totalPassengers)} passengers`,
        icon: ICONS.ticket.node,
        color: ICONS.ticket.color,
      },
      {
        label: "Avg Occupancy",
        value: formatPercent(summary.averageOccupancy),
        detail: `${formatCount(summary.totalTickets)} tickets issued`,
        icon: ICONS.seat.node,
        color: ICONS.seat.color,
      },
      {
        label: "Cancellations",
        value: formatCount(summary.totalCancellations),
        detail: `${formatCurrency(summary.refundedAmount, true)} refunded`,
        icon: ICONS.cancel.node,
        color: ICONS.cancel.color,
      },
      {
        label: "Trips",
        value: formatCount(summary.totalTrips),
        detail: `${summary.completedTrips} completed · ${summary.scheduledTrips} scheduled`,
        icon: ICONS.trip.node,
        color: ICONS.trip.color,
      },
      {
        label: "Fleet",
        value: formatCount(summary.totalBuses),
        detail: `${formatCount(summary.totalSeats)} seats total`,
        icon: ICONS.bus.node,
        color: ICONS.bus.color,
      },
    ];

    if (isAdmin) {
      core.push(
        {
          label: "New Users",
          value: formatCount(summary.newUsers ?? 0),
          detail: `${formatCount(summary.totalUsers ?? 0)} total users`,
          icon: ICONS.user.node,
          color: ICONS.user.color,
        },
        {
          label: "Operators",
          value: formatCount(summary.totalOperators ?? 0),
          detail: `${formatCount(summary.totalRoutes ?? 0)} routes live`,
          icon: ICONS.operator.node,
          color: ICONS.operator.color,
        },
      );
    }

    return core;
  }, [isAdmin, summary]);

  const performanceTabs = useMemo(() => {
    const tabs = [
      {
        key: "routes",
        label: "Routes",
        rows: data?.routePerformance ?? [],
        columns: routeColumns,
        emptyText: "No route activity in this period",
      },
      {
        key: "buses",
        label: "Buses",
        rows: data?.busPerformance ?? [],
        columns: busColumns,
        emptyText: "No bus activity in this period",
      },
    ];
    if (isAdmin) {
      tabs.push({
        key: "operators",
        label: "Operators",
        rows: data?.operatorPerformance ?? [],
        columns: operatorColumns,
        emptyText: "No operator activity in this period",
      });
    }
    return tabs;
  }, [data, isAdmin]);

  const trendModeOptions = TREND_MODES.map((mode) => ({
    value: mode.key,
    label: mode.label,
  }));

  return (
    <section className="py-6">
      <AnalyticsHeader
        isAdmin={isAdmin}
        range={range}
        onRangeChange={setRange}
        onPreset={setPreset}
        operatorId={operatorId}
        onOperatorChange={setOperatorId}
        operators={operators}
      />

      {loading ? (
        <AnalyticsSkeleton isAdmin={isAdmin} />
      ) : error ? (
        <div className="alert alert-error flex items-center justify-between">
          <span>{error}</span>
          <button type="button" className="btn btn-sm btn-secondary" onClick={reload}>
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <KpiGrid items={kpis} />

          <div className={`grid gap-6 ${isAdmin ? "lg:grid-cols-5" : ""}`}>
            <ChartCard
              title="Bookings & Revenue Trend"
              subtitle="Daily confirmed bookings, passengers and collections"
              className={isAdmin ? "lg:col-span-3" : ""}
              actions={
                <SegmentedControl
                  options={trendModeOptions}
                  value={trendMode.key}
                  onChange={setTrendKey}
                />
              }
            >
              <TrendChart
                data={data?.trend ?? []}
                valueKey={trendMode.key}
                formatter={trendMode.formatter}
                valueLabel={trendMode.valueLabel}
              />
            </ChartCard>

            {isAdmin && (
              <ChartCard
                title="New User Signups"
                subtitle="Accounts created per day"
                className="lg:col-span-2"
              >
                <TrendChart
                  data={data?.userGrowth ?? []}
                  valueKey="count"
                  formatter={countFormatter}
                  valueLabel="Signups"
                />
              </ChartCard>
            )}
          </div>

          <PerformancePanel tabs={performanceTabs} />

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Top Performers
            </h3>
            <div className={`grid gap-6 ${isAdmin ? "lg:grid-cols-3" : "md:grid-cols-2"}`}>
              <ChartCard title="Top Routes" subtitle="By revenue">
                <RankedBarChart
                  items={data?.routePerformance ?? []}
                  valueOf={(row) => row.revenue}
                  labelOf={(row) => row.routeName}
                  detailOf={routeDetail}
                  formatValue={revenueFormatter}
                  color="bg-primary-500"
                />
              </ChartCard>

              <ChartCard title="Top Buses" subtitle="By revenue">
                <RankedBarChart
                  items={data?.busPerformance ?? []}
                  valueOf={(row) => row.revenue}
                  labelOf={(row) => row.registrationNumber}
                  detailOf={busDetail}
                  formatValue={revenueFormatter}
                  color="bg-success-500"
                />
              </ChartCard>

              {isAdmin && (
                <ChartCard title="Top Operators" subtitle="By revenue">
                  <RankedBarChart
                    items={data?.operatorPerformance ?? []}
                    valueOf={(row) => row.revenue}
                    labelOf={(row) => row.operatorName}
                    detailOf={operatorDetail}
                    formatValue={revenueFormatter}
                    color="bg-info-500"
                  />
                </ChartCard>
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}