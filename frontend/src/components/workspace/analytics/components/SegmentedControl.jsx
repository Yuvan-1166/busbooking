/**
 * Small segmented button group used for date presets, chart mode switches and
 * performance tabs. Options may be plain strings or { value, label } objects.
 */
export default function SegmentedControl({
  options = [],
  value,
  onChange,
}) {
  return (
    <div className="flex rounded-lg border border-neutral-200 bg-neutral-50 p-1">
      {options.map((option) => {
        const normalized = typeof option === "string" ? { value: option, label: option } : option;
        const active = value === normalized.value;
        return (
          <button
            key={normalized.value}
            type="button"
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-white text-primary-600 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
            onClick={() => onChange(normalized.value)}
          >
            {normalized.label}
          </button>
        );
      })}
    </div>
  );
}