import { useState } from "react";
import ChartCard from "./ChartCard";
import AnalyticsTable from "./AnalyticsTable";
import SegmentedControl from "./SegmentedControl";

/**
 * Tabbed breakdown panel. Each tab is { key, label, rows, columns, emptyText }.
 * Replaces stacked per-metric tables with a single switchable panel.
 */
export default function PerformancePanel({
  tabs = [],
  title = "Performance Breakdown",
  subtitle = "Aggregated across the selected range",
}) {
  const [activeKey, setActiveKey] = useState(tabs[0]?.key ?? null);
  const activeTab = tabs.find((tab) => tab.key === activeKey) ?? tabs[0];

  if (tabs.length === 0) return null;

  const tabOptions = tabs.map((tab) => ({
    value: tab.key,
    label: tab.label,
  }));

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      actions={
        <SegmentedControl
          options={tabOptions}
          value={activeTab?.key}
          onChange={setActiveKey}
        />
      }
    >
      <AnalyticsTable
        rows={activeTab?.rows ?? []}
        columns={activeTab?.columns ?? []}
        emptyText={activeTab?.emptyText}
      />
    </ChartCard>
  );
}