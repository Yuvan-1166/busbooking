// Pure date-range helpers for the analytics dashboard (no UI, no side effects).

const pad = (n) => String(n).padStart(2, "0");

export const toISO = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const todayISO = () => toISO(new Date());

export const daysAgoISO = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toISO(date);
};

// Default range: the last N days inclusive of today.
export const defaultRange = (days = 30) => ({
  from: daysAgoISO(days - 1),
  to: todayISO(),
});

export const PRESETS = [
  { key: "7d", label: "7D", range: () => defaultRange(7) },
  { key: "30d", label: "30D", range: () => defaultRange(30) },
  { key: "90d", label: "90D", range: () => defaultRange(90) },
  {
    key: "ytd",
    label: "YTD",
    range: () => ({ from: `${new Date().getFullYear()}-01-01`, to: todayISO() }),
  },
];

// Returns the preset key that matches the given range, or null for custom ranges.
export const presetForRange = (from, to) => {
  const preset = PRESETS.find((entry) => {
    const range = entry.range();
    return range.from === from && range.to === to;
  });
  return preset?.key ?? null;
};