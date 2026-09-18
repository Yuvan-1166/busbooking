import { useEffect, useState } from "react";
import { api } from "../../api";

export default function TemplateGallery({ onSelectTemplate, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL"); // ALL, SINGLE, DOUBLE
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSeatTemplates();
      setTemplates(data);
    } catch (err) {
      setError(err.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    if (filter === "ALL") return true;
    return template.deckType === filter;
  });

  const handleSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-sm border-2 border-[#e7e5dc] bg-paper p-8 shadow-xl">
          <p className="text-center text-muted">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-sm border-2 border-[#e7e5dc] bg-paper p-8 shadow-xl">
          <p className="text-center text-red-600">{error}</p>
          <button
            className="mt-4 border-0 bg-orange px-4 py-2 text-white"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-sm border-2 border-[#e7e5dc] bg-paper shadow-xl">
        {/* Header */}
        <div className="border-b border-line bg-[#f4f5ef] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 font-mono text-[10px] tracking-[.13em] text-green">
                SELECT SEAT TEMPLATE
              </p>
              <h2 className="m-0 font-display text-[29px] font-semibold text-ink">
                Pre-built Bus Layouts
              </h2>
              <p className="mt-2 text-sm text-muted">
                Choose a professional seat arrangement template to quickly set
                up your bus configuration. All templates include proper seat
                numbering and gender-reserved seating.
              </p>
            </div>
            <button
              type="button"
              className="border-0 bg-transparent text-[32px] text-muted hover:text-ink"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Filter */}
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              className={`border-0 px-4 py-2 text-sm font-semibold ${
                filter === "ALL"
                  ? "bg-orange text-white"
                  : "bg-[#e7e5dc] text-muted hover:bg-[#d9d7ce]"
              }`}
              onClick={() => setFilter("ALL")}
            >
              All Templates ({templates.length})
            </button>
            <button
              type="button"
              className={`border-0 px-4 py-2 text-sm font-semibold ${
                filter === "SINGLE"
                  ? "bg-orange text-white"
                  : "bg-[#e7e5dc] text-muted hover:bg-[#d9d7ce]"
              }`}
              onClick={() => setFilter("SINGLE")}
            >
              Single Deck ({templates.filter((t) => t.deckType === "SINGLE").length})
            </button>
            <button
              type="button"
              className={`border-0 px-4 py-2 text-sm font-semibold ${
                filter === "DOUBLE"
                  ? "bg-orange text-white"
                  : "bg-[#e7e5dc] text-muted hover:bg-[#d9d7ce]"
              }`}
              onClick={() => setFilter("DOUBLE")}
            >
              Double Decker ({templates.filter((t) => t.deckType === "DOUBLE").length})
            </button>
          </div>
        </div>

        {/* Template Grid */}
        <div className="max-h-[calc(90vh-280px)] overflow-y-auto p-6">
          {filteredTemplates.length === 0 ? (
            <p className="text-center text-muted">
              No templates found for this filter.
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
        <div className="border-t border-line bg-[#f4f5ef] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              {selectedTemplate && (
                <p className="text-sm text-muted">
                  Selected: <strong className="text-ink">{selectedTemplate.name}</strong>{" "}
                  ({selectedTemplate.totalSeats} seats)
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="border border-line bg-transparent px-5 py-3 text-sm font-semibold text-ink hover:bg-[#e7e5dc]"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="border-0 bg-orange px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                onClick={handleConfirm}
                disabled={!selectedTemplate}
              >
                Use This Template →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ template, isSelected, onSelect }) {
  const typeIcons = {
    SLEEPER_2X1: "🛏️",
    AC_SEATER_2X2: "💺",
    AC_SEATER_2X3: "💺",
    SEMI_SLEEPER_2X2: "🪑",
    VOLVO_MULTI_AXLE: "✨",
    MINI_BUS_2X1: "🚐",
    LUXURY_COACH_1X2: "👑",
    DOUBLE_DECKER_SEATER: "🚌",
    DOUBLE_DECKER_SLEEPER: "🚌",
  };

  const icon = typeIcons[template.templateType] || "🚌";

  return (
    <button
      type="button"
      className={`group relative w-full border-2 bg-white p-5 text-left transition hover:shadow-md ${
        isSelected
          ? "border-orange shadow-[0_0_0_3px_rgba(233,101,69,.16)]"
          : "border-line hover:border-[#d9d7ce]"
      }`}
      onClick={() => onSelect(template)}
    >
      {/* Deck Type Badge */}
      <span
        className={`mb-3 inline-block rounded-full px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider ${
          template.deckType === "DOUBLE"
            ? "bg-[#e9e0ca] text-[#745e28]"
            : "bg-[#e4f0df] text-[#4c6746]"
        }`}
      >
        {template.deckType === "DOUBLE" ? "🚌 Double Deck" : "Single Deck"}
      </span>

      {/* Icon & Name */}
      <div className="mb-2 flex items-start gap-3">
        <span className="text-3xl">{icon}</span>
        <div className="flex-1">
          <h3 className="m-0 font-display text-[19px] font-semibold leading-tight text-ink">
            {template.name}
          </h3>
        </div>
      </div>

      {/* Description */}
      <p className="mb-4 mt-2 text-xs leading-relaxed text-muted">
        {template.description}
      </p>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 border-t border-line pt-3 font-mono text-[10px] text-muted">
        <span>
          <strong className="text-base text-ink">{template.totalSeats}</strong>{" "}
          {template.templateType.includes("SLEEPER") ? "berths" : "seats"}
        </span>
        {template.configuration?.decks?.map((deck, i) => (
          <span key={i}>
            <strong className="text-sm text-ink">{deck.rows}×{deck.columns}</strong>{" "}
            {deck.deckName || `Deck ${i + 1}`}
          </span>
        ))}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-orange text-white">
          ✓
        </div>
      )}
    </button>
  );
}
