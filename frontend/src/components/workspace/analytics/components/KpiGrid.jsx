const ICON_TONES = {
  primary: "bg-primary-50 text-primary-600",
  success: "bg-success-50 text-success-600",
  warning: "bg-warning-50 text-warning-600",
  info: "bg-info-50 text-info-600",
};

const DETAIL_DOTS = {
  primary: "bg-primary-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  info: "bg-info-500",
};

/** Single stat card: label, primary value, icon chip and detail line. */
export function KpiCard({ label, value, detail, icon, color = "primary" }) {
  return (
    <article className="card flex flex-col justify-between gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {label}
        </span>
        {icon && (
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              ICON_TONES[color] || ICON_TONES.primary
            }`}
          >
            {icon}
          </span>
        )}
      </div>
      <strong className="text-2xl font-bold tabular-nums tracking-tight text-neutral-900">
        {value}
      </strong>
      <p className="flex items-center gap-1.5 text-xs text-neutral-500">
        <span
          className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
            DETAIL_DOTS[color] || DETAIL_DOTS.primary
          }`}
        />
        <span className="truncate">{detail}</span>
      </p>
    </article>
  );
}

/** Responsive grid of stat cards with consistent heights. */
export default function KpiGrid({ items = [] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
      {items.map((item) => (
        <KpiCard key={item.label} {...item} />
      ))}
    </div>
  );
}