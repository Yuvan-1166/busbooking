import { useState, useMemo } from "react";
import {
  generateTripDates,
  validateTripGeneration,
  formatOperatingDays,
} from "../../utils/tripGeneration";

const emptyScheduleForm = {
  routeId: "",
  busId: "",
  departureTime: "",
  effectiveFrom: "",
  effectiveUntil: "",
  baseFare: "",
  pricePerKm: "",
  status: "ACTIVE",
  operatingDays: {
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true,
    sun: true,
  },
  tripGenerationFrom: "",
  tripGenerationTo: "",
};

export default function EnhancedScheduleForm({
  scheduleForm,
  onScheduleChange,
  onOperatingDayChange,
  onSaveSchedule,
  onCancelEdit,
  editingScheduleId,
  routes,
  buses,
  saving,
}) {
  const [showPreview, setShowPreview] = useState(false);

  // Calculate generated trip dates
  const generatedDates = useMemo(() => {
    if (
      scheduleForm.tripGenerationFrom &&
      scheduleForm.tripGenerationTo &&
      Object.values(scheduleForm.operatingDays).some((v) => v)
    ) {
      return generateTripDates(
        scheduleForm.tripGenerationFrom,
        scheduleForm.tripGenerationTo,
        scheduleForm.operatingDays,
      );
    }
    return [];
  }, [
    scheduleForm.tripGenerationFrom,
    scheduleForm.tripGenerationTo,
    scheduleForm.operatingDays,
  ]);

  // Validate trip generation
  const validationErrors = useMemo(() => {
    return validateTripGeneration(
      scheduleForm.tripGenerationFrom,
      scheduleForm.tripGenerationTo,
      scheduleForm.operatingDays,
    );
  }, [
    scheduleForm.tripGenerationFrom,
    scheduleForm.tripGenerationTo,
    scheduleForm.operatingDays,
  ]);

  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  return (
    <form
      onSubmit={onSaveSchedule}
      className="w-full rounded-lg border border-[#e7e5dc] bg-white p-7 max-h-[90vh]"
    >

      {/* Row 1: Route & Bus */}
      <div className="grid grid-cols-2 gap-3 mb-7">
        <label className="block">
          <span className="text-xs font-mono uppercase text-muted block mb-1">
            Route *
          </span>
          <select
            value={scheduleForm.routeId}
            onChange={(e) => onScheduleChange("routeId", e.target.value)}
            required
            className="w-full border-b border-line bg-transparent py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange"
          >
            <option value="">Select</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-mono uppercase text-muted block mb-1">
            Bus *
          </span>
          <select
            value={scheduleForm.busId}
            onChange={(e) => onScheduleChange("busId", e.target.value)}
            required
            className="w-full border-b border-line bg-transparent py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange"
          >
            <option value="">Select</option>
            {buses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.registrationNumber}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Row 2: Time & Pricing */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        <label className="block">
          <span className="text-xs font-mono uppercase text-muted block mb-1">
            Time *
          </span>
          <input
            type="time"
            value={scheduleForm.departureTime}
            onChange={(e) => onScheduleChange("departureTime", e.target.value)}
            required
            className="w-full border-b border-line bg-transparent py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange"
          />
        </label>
        <label className="block">
          <span className="text-xs font-mono uppercase text-muted block mb-1">
            Base (₹) *
          </span>
          <input
            type="number"
            step="0.01"
            value={scheduleForm.baseFare}
            onChange={(e) => onScheduleChange("baseFare", e.target.value)}
            required
            className="w-full border-b border-line bg-transparent py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange"
          />
        </label>
        <label className="block">
          <span className="text-xs font-mono uppercase text-muted block mb-1">
            /KM (₹) *
          </span>
          <input
            type="number"
            step="0.01"
            value={scheduleForm.pricePerKm}
            onChange={(e) => onScheduleChange("pricePerKm", e.target.value)}
            required
            className="w-full border-b border-line bg-transparent py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange"
          />
        </label>
      </div>

      {/* Row 3: Effective Dates */}
      <div className="grid grid-cols-2 gap-5 mb-7">
        <label className="block">
          <span className="text-xs font-mono uppercase text-muted block mb-1">
            From
          </span>
          <input
            type="date"
            value={scheduleForm.effectiveFrom}
            onChange={(e) => onScheduleChange("effectiveFrom", e.target.value)}
            className="w-full border-b border-line bg-transparent py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange"
          />
        </label>
        <label className="block">
          <span className="text-xs font-mono uppercase text-muted block mb-1">
            Until
          </span>
          <input
            type="date"
            value={scheduleForm.effectiveUntil}
            onChange={(e) => onScheduleChange("effectiveUntil", e.target.value)}
            className="w-full border-b border-line bg-transparent py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange"
          />
        </label>
      </div>
      <div  className="grid grid-cols-1 gap-3 mb-7">
        <label className="block">
          <span className="text-xs font-mono uppercase text-muted block mb-1">
            Status
          </span>
          <select
            value={scheduleForm.status}
            onChange={(e) => onScheduleChange("status", e.target.value)}
            className="w-full border-b border-line bg-transparent py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
      </div>

      {/* Operating Days - Compact */}
      <div className="mb-7">
        <p className="text-xs font-mono uppercase text-muted mb-2">
          Operating Days
        </p>
        <div className="flex gap-1.5">
          {days.map((day, index) => (
            <button
              key={day}
              type="button"
              onClick={() => onOperatingDayChange(dayKeys[index])}
              className={`h-8 w-8 rounded font-bold text-xs transition-colors ${
                scheduleForm.operatingDays[dayKeys[index]]
                  ? "bg-orange text-white"
                  : "border border-[#e7e5dc] bg-white text-muted hover:bg-[#fafaf8]"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted mt-1.5">
          {formatOperatingDays(scheduleForm.operatingDays)}
        </p>
      </div>

      {/* Trip Generation - Compact */}
      <div className="mb-7 border-t border-[#e7e5dc] pt-4">
        <p className="text-xs font-mono uppercase text-muted mb-2">
          Generate Trips
        </p>
        {validationErrors.length > 0 && (
          <div className="mb-3 text-xs text-[#8c3e2d]">
            {validationErrors.map((err, i) => (
              <div key={i}>• {err.substring(0, 40)}</div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 mb-2">
          <label className="block">
            <span className="text-xs font-mono uppercase text-muted block mb-1">
              From *
            </span>
            <input
              type="date"
              value={scheduleForm.tripGenerationFrom}
              onChange={(e) =>
                onScheduleChange("tripGenerationFrom", e.target.value)
              }
              className="w-full border-b border-line bg-transparent py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange"
            />
          </label>
          <label className="block">
            <span className="text-xs font-mono uppercase text-muted block mb-1">
              To *
            </span>
            <input
              type="date"
              value={scheduleForm.tripGenerationTo}
              onChange={(e) =>
                onScheduleChange("tripGenerationTo", e.target.value)
              }
              className="w-full border-b border-line bg-transparent py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange"
            />
          </label>
        </div>

        {generatedDates.length > 0 && (
          <div className="flex items-center justify-between text-xs bg-[#e4eee1] border border-[#a5bea0] p-2 rounded mt-2">
            <span className="text-green font-semibold">
              ✓ {generatedDates.length} trips
            </span>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-[10px] text-green hover:underline"
            >
              {showPreview ? "hide" : "preview"}
            </button>
          </div>
        )}

        {showPreview && generatedDates.length > 0 && (
          <div className="mt-2 rounded-md bg-[#f9f9f7] p-2 max-h-[80px] overflow-y-auto">
            <div className="grid grid-cols-6 gap-1 text-[9px]">
              {generatedDates.slice(0, 12).map((date) => (
                <div
                  key={date}
                  className="px-1 py-0.5 bg-white border border-[#e7e5dc] rounded text-center"
                >
                  {new Date(date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
              ))}
              {generatedDates.length > 12 && (
                <div className="px-1 py-0.5 text-muted">
                  +{generatedDates.length - 12} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 border-t border-[#e7e5dc]">
        <button
          type="submit"
          disabled={saving || validationErrors.length > 0}
          className="flex-1 bg-orange text-white py-2 rounded text-xs font-semibold hover:bg-[#d97e3a] disabled:opacity-50 transition-colors"
        >
          {saving ? "Creating..." : editingScheduleId ? "Update" : "Publish"}
        </button>
        {editingScheduleId && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex-1 border border-[#e7e5dc] text-ink py-2 rounded text-xs font-semibold hover:bg-[#fafaf8]"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
