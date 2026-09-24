import { useState } from "react";
import SegmentedControl from "./SegmentedControl";
import { PRESETS, presetForRange } from "../dateRange";

/**
 * Segmented preset switcher + custom from/to inputs.
 * Calling apps re-fetch when `range` actually changes.
 */
export default function DateRangeFilter({ range, onPreset, onRangeChange }) {
  const [fromDraft, setFromDraft] = useState(range.from);
  const [toDraft, setToDraft] = useState(range.to);
  const activePreset = presetForRange(range.from, range.to);

  const presetOptions = PRESETS.map((preset) => ({
    value: preset.key,
    label: preset.label,
  }));

  const applyCustom = () => {
    if (!fromDraft || !toDraft) return;
    const ordered =
      fromDraft > toDraft
        ? { from: toDraft, to: fromDraft }
        : { from: fromDraft, to: toDraft };
    onRangeChange(ordered);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedControl
        options={presetOptions}
        value={activePreset}
        onChange={onPreset}
      />

      <div className="flex items-center gap-2">
        <input
          type="date"
          aria-label="From date"
          className="input h-9 w-36"
          value={fromDraft}
          max={toDraft}
          onChange={(event) => setFromDraft(event.target.value)}
        />
        <span className="text-xs text-neutral-400">to</span>
        <input
          type="date"
          aria-label="To date"
          className="input h-9 w-36"
          value={toDraft}
          min={fromDraft}
          onChange={(event) => setToDraft(event.target.value)}
        />
        <button
          type="button"
          className="btn btn-secondary h-9 px-4"
          onClick={applyCustom}
        >
          Apply
        </button>
      </div>
    </div>
  );
}