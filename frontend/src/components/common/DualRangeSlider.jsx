export default function DualRangeSlider({
  minValue,
  maxValue,
  minLimit,
  maxLimit,
  onChange,
}) {
  const handleMinChange = (e) => {
    const newMin = parseFloat(e.target.value);
    if (newMin <= maxValue) {
      onChange([newMin, maxValue]);
    }
  };

  const handleMaxChange = (e) => {
    const newMax = parseFloat(e.target.value);
    if (newMax >= minValue) {
      onChange([minValue, newMax]);
    }
  };

  const minPercent = ((minValue - minLimit) / (maxLimit - minLimit)) * 100;
  const maxPercent = ((maxValue - minLimit) / (maxLimit - minLimit)) * 100;

  return (
    <div className="space-y-4">
      {/* Range Slider Container */}
      <div className="relative pt-2 pb-8">
        {/* Track Background */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-[#e7e5dc] rounded pointer-events-none" />

        {/* Active Track */}
        <div
          className="absolute top-5 h-1 bg-orange rounded pointer-events-none"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
          }}
        />

        {/* Min Slider */}
        <input
          type="range"
          min={minLimit}
          max={maxLimit}
          step="1"
          value={minValue}
          onChange={handleMinChange}
          className="absolute w-full h-1 top-5 appearance-none bg-transparent cursor-pointer accent-orangepointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
          style={{
            zIndex: minValue > maxLimit - (maxLimit - minLimit) / 2 ? 5 : 3,
          }}
        />

        {/* Max Slider */}
        <input
          type="range"
          min={minLimit}
          max={maxLimit}
          step="1"
          value={maxValue}
          onChange={handleMaxChange}
          className="absolute w-full h-1 top-5 appearance-none bg-transparent cursor-pointer accent-orange pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
          style={{
            zIndex: maxValue < minLimit + (maxLimit - minLimit) / 2 ? 3 : 5,
          }}
        />

        {/* Min Label */}
        <div
          className="absolute top-10 text-xs font-semibold text-orange whitespace-nowrap"
          style={{
            left: `${minPercent}%`,
            transform: "translateX(-50%)",
          }}
        >
          ₹{minValue.toFixed(2)}
        </div>

        {/* Max Label */}
        <div
          className="absolute top-10 text-xs font-semibold text-orange whitespace-nowrap"
          style={{
            left: `${maxPercent}%`,
            transform: "translateX(-50%)",
          }}
        >
          ₹{maxValue.toFixed(2)}
        </div>
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-mono text-muted mb-1 block">Min</label>
          <input
            type="number"
            step="1"
            min={minLimit}
            max={maxValue}
            value={minValue}
            onChange={(e) => {
              const val = Math.max(minLimit, Math.min(parseFloat(e.target.value) || minLimit, maxValue));
              onChange([val, maxValue]);
            }}
            className="w-full rounded border border-[#e7e5dc] px-2 py-1.5 text-sm font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-orange"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-muted mb-1 block">Max</label>
          <input
            type="number"
            step="1"
            min={minValue}
            max={maxLimit}
            value={maxValue}
            onChange={(e) => {
              const val = Math.min(maxLimit, Math.max(parseFloat(e.target.value) || maxLimit, minValue));
              onChange([minValue, val]);
            }}
            className="w-full rounded border border-[#e7e5dc] px-2 py-1.5 text-sm font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-orange"
          />
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-muted font-mono">
        Available: ₹{minLimit.toFixed(2)} - ₹{maxLimit.toFixed(2)}
      </div>
    </div>
  );
}
