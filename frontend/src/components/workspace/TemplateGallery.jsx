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
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-neutral-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Select Seat Template
              </p>
              <h2 className="m-0 text-2xl font-semibold text-neutral-900">
                Pre-built Bus Layouts
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                Choose a professional seat arrangement template to quickly set
                up your bus configuration. All templates include proper seat
                numbering and gender-reserved seating.
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

          {/* Filter */}
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              className={`rounded-md border-0 px-4 py-2 text-sm font-semibold transition-colors ${
                filter === "ALL"
                  ? "bg-primary-600 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
              onClick={() => setFilter("ALL")}
            >
              All Templates ({templates.length})
            </button>
            <button
              type="button"
              className={`rounded-md border-0 px-4 py-2 text-sm font-semibold transition-colors ${
                filter === "SINGLE"
                  ? "bg-primary-600 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
              onClick={() => setFilter("SINGLE")}
            >
              Single Deck ({templates.filter((t) => t.deckType === "SINGLE").length})
            </button>
            <button
              type="button"
              className={`rounded-md border-0 px-4 py-2 text-sm font-semibold transition-colors ${
                filter === "DOUBLE"
                  ? "bg-primary-600 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
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
            <p className="text-center text-neutral-500">
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
        <div className="border-t border-neutral-200 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              {selectedTemplate && (
                <p className="text-sm text-neutral-500">
                  Selected: <strong className="text-neutral-900">{selectedTemplate.name}</strong>{" "}
                  ({selectedTemplate.totalSeats} seats)
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={!selectedTemplate}
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ template, isSelected, onSelect }) {
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
        </div>
      </div>

      {/* Description */}
      <p className="mb-4 mt-2 text-xs leading-relaxed text-neutral-500">
        {template.description}
      </p>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 border-t border-neutral-200 pt-3 text-xs font-medium text-neutral-500">
        <span>
          <strong className="text-lg font-semibold text-neutral-900">{template.totalSeats}</strong>{" "}
          {template.templateType.includes("SLEEPER") ? "berths" : "seats"}
        </span>
        {template.configuration?.decks?.map((deck, i) => (
          <span key={i}>
            <strong className="text-base font-semibold text-neutral-900">{deck.rows}×{deck.columns}</strong>{" "}
            {deck.deckName || `Deck ${i + 1}`}
          </span>
        ))}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-white">
          ✓
        </div>
      )}
    </button>
  );
}
