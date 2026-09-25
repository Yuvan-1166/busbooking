import { useId, useMemo, useRef, useState } from "react";
import { formatDate } from "../../../../utils/format";

const W = 600;
const H = 240;
const PAD = { top: 18, right: 16, bottom: 26, left: 48 };

/**
 * Dependency-free SVG area chart with hover crosshair and tooltip.
 *
 * @param {Array<object>} data points, each containing `date` plus `valueKey`
 * @param {string} valueKey property to plot (e.g. "bookings", "revenue")
 * @param {(value: number) => string} formatter axis + tooltip formatting
 * @param {string} valueLabel human label shown in the tooltip
 */
export default function TrendChart({
  data = [],
  valueKey = "bookings",
  formatter = (value) => String(value),
  valueLabel = "Value",
}) {
  const gradientId = useId();
  const wrapRef = useRef(null);
  const [hovered, setHovered] = useState(null);

  const model = useMemo(() => {
    if (data.length === 0) return null;
    const values = data.map((point) => Number(point[valueKey] ?? 0));
    const max = Math.max(...values, 0) || 1;
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const step = innerW / Math.max(data.length - 1, 1);
    const center = data.length === 1;

    const pts = data.map((point, i) => ({
      x: center ? W / 2 : PAD.left + step * i,
      y: PAD.top + innerH - (values[i] / max) * innerH,
      date: point.date,
      value: values[i],
    }));

    return { pts, max, innerW, innerH };
  }, [data, valueKey]);

  if (!model) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-neutral-400">
        No data for the selected range
      </div>
    );
  }

  const linePath = model.pts
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
    )
    .join(" ");
  const areaPath = `${linePath} L ${model.pts[model.pts.length - 1].x.toFixed(1)} ${PAD.top + model.innerH} L ${model.pts[0].x.toFixed(1)} ${PAD.top + model.innerH} Z`;

  const gridLines = [0, 0.5, 1].map((frac) => ({
    y: PAD.top + model.innerH - frac * model.innerH,
    label: formatter(model.max * frac),
  }));

  const xLabels = [
    0,
    Math.floor((model.pts.length - 1) / 2),
    model.pts.length - 1,
  ];

  const handleMove = (event) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = rect.width / W;
    const x = (event.clientX - rect.left) / scale;
    const nearest = model.pts.reduce(
      (best, point, index) =>
        Math.abs(point.x - x) < Math.abs(model.pts[best].x - x) ? index : best,
      0,
    );
    setHovered(model.pts[nearest]);
  };

  return (
    <div
      ref={wrapRef}
      className="relative w-full"
      onMouseMove={handleMove}
      onMouseLeave={() => setHovered(null)}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Trend chart"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {gridLines.map((line, index) => (
          <g key={index}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={line.y}
              y2={line.y}
              stroke="#e8ecef"
              strokeWidth="1"
              strokeDasharray={index === 2 ? undefined : "4 4"}
            />
            <text
              x={PAD.left - 8}
              y={line.y + 4}
              textAnchor="end"
              fill="#9ba6b1"
              fontSize="10"
            >
              {line.label}
            </text>
          </g>
        ))}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {model.pts.map((point) =>
          point.value > 0 ? (
            <circle
              key={point.x}
              cx={point.x}
              cy={point.y}
              r="3"
              fill="#fff"
              stroke="#3b82f6"
              strokeWidth="2"
            />
          ) : null,
        )}

        {xLabels.map((index, i) => {
          const point = model.pts[index];
          return (
            <text
              key={index}
              x={point.x}
              y={H - 6}
              textAnchor={
                i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle"
              }
              fill="#9ba6b1"
              fontSize="10"
            >
              {formatDate(point.date)}
            </text>
          );
        })}
      </svg>

      {hovered && (
        <>
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-primary-200"
            style={{ left: `${(hovered.x / W) * 100}%` }}
          />
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md"
            style={{
              left: `${(hovered.x / W) * 100}%`,
              top: `${(hovered.y / H) * 100}%`,
            }}
          >
            <div className="font-medium text-neutral-900">
              {formatDate(hovered.date)}
            </div>
            <div className="font-semibold tabular-nums text-primary-600">
              {valueLabel}: {formatter(hovered.value)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
