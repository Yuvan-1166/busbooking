import { useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import { templatesForBus } from "../../utils/busSeatTemplates";

const SEAT_CLASS_LABELS = {
  SEAT: "Seater",
  SEMI_SLEEPER: "Semi-Sleeper",
  SLEEPER: "Sleeper",
};

const formatEnumLabel = (value) =>
  (value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatBusType = (busType) => formatEnumLabel(busType);
const formatDeckType = (deckType) =>
  deckType === "DOUBLE" ? "Double Decker" : "Single Deck";

function Chevron({ direction }) {
  const d = direction === "up" ? "M5 12l5-5 5 5" : "M5 8l5 5 5-5";
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}

export default function TemplateGallery({ bus, onSelectTemplate, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [rowCounts, setRowCounts] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSeatTemplates(bus?.deckType);
      setTemplates(data);
    } catch (err) {
      setError(err.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = useMemo(
    () => templatesForBus(templates, bus),
    [templates, bus],
  );

  const handleSelect = (template) => {
    setSelectedTemplate(template);
    setRowCounts(
      (template.configuration?.decks || []).map((deck) => deck.rows ?? 0),
    );
    setExpanded(true);
  };

  const handleDismiss = () => {
    setSelectedTemplate(null);
    setRowCounts([]);
    setExpanded(false);
  };

  const handleRowChange = (index, value) => {
    setRowCounts((current) => {
      const next = [...current];
      next[index] = value === "" ? "" : Number(value);
      return next;
    });
  };

  const projectedTotal = useMemo(() => {
    if (!selectedTemplate) return 0;
    const decks = selectedTemplate.configuration?.decks || [];
    return rowCounts.reduce(
      (total, rows, index) =>
        total +
        (Number(rows) || 0) *
          (decks[index]?.leftSeats + decks[index]?.rightSeats || 0),
      0,
    );
  }, [selectedTemplate, rowCounts]);

  const allRowsValid =
    rowCounts.length > 0 && rowCounts.every((count) => Number(count) >= 1);

  const handleConfirm = () => {
    if (!selectedTemplate) return;
    const rows = allRowsValid ? rowCounts.map(Number) : null;
    onSelectTemplate(selectedTemplate, rows);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-lg border border-neutral-200 bg-white p-8 shadow-xl">
          <p className="text-center text-neutral-500">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-lg border border-neutral-200 bg-white p-8 shadow-xl">
          <p className="text-center text-error-600">{error}</p>
          <button className="btn btn-primary mt-4" onClick={onClose} type="button">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-neutral-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Select Seat Template
              </p>
              <h2 className="m-0 text-2xl font-semibold text-neutral-900">
                Bus Seat Arrangements
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                Templates shown here are pre-filtered for the selected{" "}
                <strong className="text-neutral-700">
                  {formatBusType(bus?.busType)} ·{" "}
                  {formatDeckType(bus?.deckType)}
                </strong>{" "}
                bus. Choose an arrangement, then set the number of rows to match
                your bus. The rest of the layout stays fixed.
              </p>
            </div>
            <button
              type="button"
              className="border-0 bg-transparent text-3xl leading-none text-neutral-500 hover:text-neutral-900"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Context badge */}
          <div className="mt-5 flex items-center gap-2">
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
              {formatBusType(bus?.busType)}
            </span>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
              {formatDeckType(bus?.deckType)} · {filteredTemplates.length}{" "}
              template{filteredTemplates.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* Template Grid */}
        <div
          className={`max-h-[calc(90vh-260px)] overflow-y-auto p-6 ${
            selectedTemplate ? "pb-72" : ""
          }`}
        >
          {filteredTemplates.length === 0 ? (
            <p className="text-center text-neutral-500">
              {templates.length === 0
                ? "No templates found for this filter."
                : "No templates match the selected bus type."}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplate?.id === template.id}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 p-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-neutral-500">
              {selectedTemplate
                ? "Template selected - fine-tune the rows below."
                : "Select a template to customize its rows."}
            </p>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>

        {/* Slide-up customization sheet */}
        <CustomizeSheet
          template={selectedTemplate}
          expanded={expanded}
          onToggle={() => setExpanded((value) => !value)}
          onDismiss={handleDismiss}
          rowCounts={rowCounts}
          projectedTotal={projectedTotal}
          onChange={handleRowChange}
          onConfirm={handleConfirm}
          allRowsValid={allRowsValid}
        />
      </div>
    </div>
  );
}

function CustomizeSheet({
  template,
  expanded,
  onToggle,
  onDismiss,
  rowCounts,
  projectedTotal,
  onChange,
  onConfirm,
  allRowsValid,
}) {
  const show = Boolean(template);
  const decks = template?.configuration?.decks || [];
  const isSleeper = template?.templateType?.includes("SLEEPER");
  const classLabel = SEAT_CLASS_LABELS[decks[0]?.seatType] || "";
  const layout = decks
    .map((deck) => `${deck.leftSeats}+${deck.rightSeats}`)
    .join(" · ");

  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-20 transition-transform duration-300 ease-out ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="rounded-t-xl border-l border-r border-t border-neutral-200 bg-white shadow-[0_-10px_30px_rgba(0,0,0,.10)]">
        {/* Grabber */}
        <div className="flex justify-center pt-2">
          <span className="h-1 w-10 rounded-full bg-neutral-300" />
        </div>

        {/* Handle bar */}
        <div className="flex items-center justify-between gap-4 px-6 pb-3 pt-2">
          <div className="min-w-0">
            {template ? (
              <>
                <p className="truncate text-sm font-semibold text-neutral-900">
                  {template.name}
                </p>
                {classLabel && (
                  <p className="truncate text-xs text-neutral-500">
                    {classLabel} · {layout}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-neutral-500">Customize</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              onClick={onToggle}
              aria-label={expanded ? "Collapse customization" : "Expand customization"}
            >
              <Chevron direction={expanded ? "down" : "up"} />
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md text-xl leading-none text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              onClick={onDismiss}
              aria-label="Clear template selection"
            >
              ×
            </button>
          </div>
        </div>

        {/* Collapsible form body */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: expanded ? "1fr" : "0fr",
            transitionProperty: "grid-template-rows",
            transitionDuration: "300ms",
            transitionTimingFunction: "ease-out",
          }}
        >
          <div className="overflow-hidden">
            {template && (
              <div className="max-h-[45vh] overflow-y-auto border-t border-neutral-200 p-6 pt-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="m-0 text-sm font-semibold text-neutral-900">
                    Customize rows
                  </p>
                  <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-semibold text-primary-600">
                    {template.totalSeats} {isSleeper ? "berths" : "seats"} default
                  </span>
                </div>

                <RowEditor template={template} rowCounts={rowCounts} onChange={onChange} />

                <div className="mt-4 flex items-center justify-between gap-4">
                  {allRowsValid ? (
                    <p className="text-sm text-neutral-500">
                      Will create{" "}
                      <strong className="text-neutral-900">{projectedTotal}</strong>{" "}
                      {isSleeper ? "berths" : "seats"}
                    </p>
                  ) : (
                    <p className="text-sm text-neutral-500">
                      Set rows for every deck to continue.
                    </p>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onConfirm}
                    disabled={!allRowsValid}
                  >
                    Use This Template
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RowEditor({ template, rowCounts, onChange }) {
  const decks = template.configuration?.decks || [];
  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {decks.map((deck, index) => (
          <div
            key={deck.deckNumber ?? index}
            className="flex items-center gap-3 rounded-md border border-neutral-200 bg-white p-3"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-900">
                {deck.deckName || `Deck ${index + 1}`}
              </p>
              <p className="text-xs text-neutral-500">
                {deck.leftSeats}+{deck.rightSeats}{" "}
                {SEAT_CLASS_LABELS[deck.seatType] || deck.seatType}
                {" · "}
                {deck.leftSeats + deck.rightSeats} per row
              </p>
            </div>
            <label className="grid gap-1 text-xs font-medium text-neutral-700">
              Rows
              {rowCounts[index] !== undefined ? (
                <input
                  className="input w-20"
                  type="number"
                  min="1"
                  max="40"
                  value={rowCounts[index]}
                  onChange={(event) => onChange(index, event.target.value)}
                />
              ) : (
                <span className="text-sm text-neutral-400">-</span>
              )}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplateCard({ template, isSelected, onSelect }) {
  const decks = template.configuration?.decks || [];
  const seatClass = decks[0]?.seatType;
  const classLabel = SEAT_CLASS_LABELS[seatClass] || "";
  const layout =
    decks.length > 1
      ? decks.map((deck) => `${deck.leftSeats}+${deck.rightSeats}`).join(" · ")
      : `${decks[0]?.leftSeats}+${decks[0]?.rightSeats}`;

  return (
    <button
      type="button"
      className={`group relative w-full rounded-md border-2 bg-white p-5 text-left transition hover:shadow-md ${
        isSelected
          ? "border-primary-500 shadow-[0_0_0_3px_rgba(59,130,246,.16)]"
          : "border-neutral-200 hover:border-neutral-300"
      }`}
      onClick={() => onSelect(template)}
    >
      {/* Deck Type Badge */}
      <span
        className={`mb-3 inline-block rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
          template.deckType === "DOUBLE"
            ? "bg-info-50 text-info-700"
            : "bg-success-50 text-success-700"
        }`}
      >
        {template.deckType === "DOUBLE" ? "Double Deck" : "Single Deck"}
      </span>

      {/* Icon & Name */}
      <div className="mb-2 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </span>
        <div className="flex-1">
          <h3 className="m-0 text-lg font-semibold leading-tight text-neutral-900">
            {template.name}
          </h3>
          {classLabel && (
            <span className="mt-0.5 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">
              {classLabel} · {layout}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 border-t border-neutral-200 pt-3 text-xs font-medium text-neutral-500">
        <span>
          <strong className="text-lg font-semibold text-neutral-900">{template.totalSeats}</strong>{" "}
          {template.templateType?.includes("SLEEPER") ? "berths" : "seats"}
        </span>
        {decks.map((deck, i) => (
          <span key={i}>
            <strong className="text-base font-semibold text-neutral-900">{deck.rows}</strong>{" "}
            rows × {deck.leftSeats}+{deck.rightSeats}{" "}
            {deck.deckName || `Deck ${i + 1}`}
          </span>
        ))}
      </div>

      {/* Description */}
      <p className="mb-2 mt-3 text-xs leading-relaxed text-neutral-500">
        {template.description}
      </p>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-white">
          ✓
        </div>
      )}
    </button>
  );
}