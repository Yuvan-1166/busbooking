/**
 * Shared card container for analytics panels: title, optional subtitle,
 * right-aligned action slot and body.
 */
export default function ChartCard({
  title,
  subtitle,
  actions,
  children,
  className = "",
}) {
  return (
    <div className={`card flex flex-col p-5 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}