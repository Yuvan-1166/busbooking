const accents = {
  primary: "border-t-primary-500",
  success: "border-t-success-500",
  warning: "border-t-warning-500",
  info: "border-t-info-500",
};

const iconTones = {
  primary: "bg-primary-50 text-primary-600",
  success: "bg-success-50 text-success-600",
  warning: "bg-warning-50 text-warning-600",
  info: "bg-info-50 text-info-600",
};

export default function MetricCard({
  label,
  value,
  detail,
  icon,
  color = "primary",
  onClick,
}) {
  const tone = accents[color] || accents.primary;

  return (
    <article
      onClick={onClick}
      className={`grid min-h-[130px] cursor-pointer gap-2 rounded-lg border border-neutral-200 border-t-[3px] bg-white p-5 transition-all ${
        onClick ? "hover:border-neutral-300 hover:shadow-sm" : ""
      } ${tone}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-neutral-500">{label}</span>
        {icon && (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
              iconTones[color] || iconTones.primary
            }`}
          >
            {icon}
          </span>
        )}
      </div>
      <strong className="self-end text-4xl font-bold leading-none text-neutral-900">
        {value}
      </strong>
      {detail && <small className="text-xs text-neutral-500">{detail}</small>}
    </article>
  );
}