import { useMemo, useRef, useState } from "react";
import { formatDate } from "../../../utils/format";

const W = 600;
const H = 240;
const PAD = { top: 14, right: 14, bottom: 26, left: 46 };

/**
 * Dependency-free SVG area chart with hover tooltips.
 *
 * @param {Array<object>} data points, each containing `date` plus the `valueKey`
 * @param {string} valueKey property to plot (e.g. "bookings", "revenue")
 * @param {(value: number) => string} formatter for axis labels and tooltips
 */
export default function TrendChart({
  data = [],
  valueKey = "bookings",
  formatter = (value) => String(value),
}) {
  const wrapRef = useRef(null);
  const [hovered, setHovered] = useState(null);

  const model = useMemo(() => {
    if (data.length === 0) return null;
    const values = data.map((point) => Number(point[valueKey] ?? 0));
    const max = Math.max(...values, 0) || 1;
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const step = innerW / Math.max(data.length - 1, 1);

    const pts = data.map((point, i) => ({
      x: PAD.left + step * i,
      y: PAD.top + innerH - (values[i] / max) * innerH,
      date: point.date,
      value: values[i],
    }));

    return { pts, max, innerH, innerW };
  }, [data, valueKey]);

  if (!model) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-neutral-400">
        No data for the selected range
      </div>
    );
  }

  const linePath = model.pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${model.pts[model.pts.length - 1].x.toFixed(1)} ${PAD.top + model.innerH} L ${model.pts[0].x.toFixed(1)} ${PAD.top + model.innerH} Z`;

  const gridLines = [0, 0.5, 1].map((frac) => ({
    y: PAD.top + model.innerH - frac * model.innerH,
    label: formatter(model.max * frac),
  }));

  const xLabels = [0, Math.floor((model.pts.length - 1) / 2), model.pts.length - 1].map(
    (i) => model.pts[i],
  );

  const handleMove = (e) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = rect.width / W;
    const x = (e.clientX - rect.left) / scale;
    const nearest = model.pts.reduce(
      (best, p, i) => (Math.abs(p.x - x) < Math.abs(model.pts[best].x - x) ? i : best),
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
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {gridLines.map((line, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={line.y}
              y2={line.y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray={i === 2 ? undefined : "4 4"}
              fill="none"
            />
            <text
              x={PAD.left - 8}
              y={line.y + 4}
              textAnchor="end"
              className="fill-neutral-400"
              fontSize="10"
            >
              {line.label}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#trend-fill)" />
        <path
          d={linePath}
          fill="none"
          stroke="#4f46e5"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {model.pts.map((p) => (
          <circle key={p.x} cx={p.x} cy={p.y} r="3" fill="#fff" stroke="#4f46e5" strokeWidth="2" />
        ))}

        {xLabels.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={H - 6}
            textAnchor={i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle"}
            className="fill-neutral-400"
            fontSize="10"
          >
            {formatDate(p.date)}
          </text>
        ))}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md"
          style={{ left: `${(hovered.x / W) * 100}%` }}
        >
          <div className="font-medium text-neutral-900">{formatDate(hovered.date)}</div>
          <div className="font-semibold text-primary-600">{formatter(hovered.value)}</div>
        </div>
      )}
    </div>
  );
}