import { useMemo, useState } from "react";

const PRESETS = [
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
  { key: "ytd", label: "YTD", days: null },
];

function presetRange(preset) {
  const to = new Date();
  let from = new Date();
  if (preset.days) {
    from.setDate(to.getDate() - (preset.days - 1));
  } else {
    from = new Date(to.getFullYear(), 0, 1);
  }
  return { from: toISO(from), to: toISO(to) };
}

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function DateRangeFilter({ from, to, onChange, onApply }) {
  const [fromDraft, setFromDraft] = useState(from);
  const [toDraft, setToDraft] = useState(to);

  const activePreset = useMemo(() => {
    const current = `${from}|${to}`;
    const match = PRESETS.find(
      (preset) => `${presetRange(preset).from}|${presetRange(preset).to}` === current,
    );
    return match?.key || null;
  }, [from, to]);

  const applyPreset = (preset) => {
    const range = presetRange(preset);
    setFromDraft(range.from);
    setToDraft(range.to);
    onChange(range.from, range.to);
  };

  const applyCustom = () => {
    if (!fromDraft || !toDraft) return;
    const ordered = fromDraft > toDraft ? { from: toDraft, to: fromDraft } : { from: fromDraft, to: toDraft };
    setFromDraft(ordered.from);
    setToDraft(ordered.to);
    onChange(ordered.from, ordered.to);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex rounded-lg border border-neutral-200 bg-neutral-50 p-1">
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activePreset === preset.key
                ? "bg-white text-primary-600 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
            onClick={() => applyPreset(preset)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1 text-xs font-medium text-neutral-600">
        From
        <input
          type="date"
          className="input h-9"
          value={fromDraft}
          max={toDraft}
          onChange={(e) => setFromDraft(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-neutral-600">
        To
        <input
          type="date"
          className="input h-9"
          value={toDraft}
          min={fromDraft}
          onChange={(e) => setToDraft(e.target.value)}
        />
      </label>

      <button type="button" className="btn btn-secondary h-9" onClick={applyCustom}>
        Apply
      </button>
    </div>
  );
}