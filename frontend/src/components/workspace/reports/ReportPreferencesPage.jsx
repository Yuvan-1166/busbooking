import { useCallback, useEffect, useState } from "react";
import { api } from "../../../api";
import { parseApiError, getErrorMessage } from "../../../utils/errorHandler";
import { saveBlob } from "../../../utils/download";

const REPORT_TYPES = {
  OPERATOR_PERFORMANCE: {
    title: "Operator Performance",
    description:
      "Bookings, occupancy, cancellations and revenue for your operation.",
  },
  PLATFORM_SUMMARY: {
    title: "Platform Summary",
    description:
      "Platform-wide users, operators, routes, trips and revenue.",
  },
};

const FREQUENCIES = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
];

const CUSTOM_RANGE = "CUSTOM";

const FREQUENCY_LABELS = Object.fromEntries(
  FREQUENCIES.map((frequency) => [frequency.value, frequency.label]),
);

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Built from the local date parts rather than toISOString, which would shift
// the day across the UTC boundary for anyone east or west of Greenwich.
const toInputDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const defaultRange = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: toInputDate(from), to: toInputDate(to) };
};

export default function ReportPreferencesPage({ role = "operator" }) {
  const isAdmin = role === "admin";
  const availableTypes = isAdmin
    ? ["OPERATOR_PERFORMANCE", "PLATFORM_SUMMARY"]
    : ["OPERATOR_PERFORMANCE"];

  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(null);
  const [downloadingCard, setDownloadingCard] = useState(null);
  const [downloadingPanel, setDownloadingPanel] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    reportType: availableTypes[0],
    frequency: "DAILY",
    active: true,
  });
  const [editingType, setEditingType] = useState(null);

  const [exportForm, setExportForm] = useState(() => ({
    reportType: availableTypes[0],
    window: "MONTHLY",
    ...defaultRange(),
  }));

  const today = toInputDate(new Date());

  const resetForm = () => {
    setEditingType(null);
    const next =
      availableTypes.find(
        (type) => !preferences.some((preference) => preference.reportType === type),
      ) ?? availableTypes[0];
    setForm({ reportType: next, frequency: "DAILY", active: true });
  };

  const reload = useCallback(
    async (background = false) => {
      if (!background) setLoading(true);
      setError("");
      try {
        setPreferences(await api.getReportPreferences());
      } catch (loadError) {
        setError(getErrorMessage(parseApiError(loadError)));
      } finally {
        if (!background) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const subscribedTypes = preferences.map(
    (preference) => preference.reportType,
  );
  const selectableTypes = availableTypes.filter(
    (type) => !subscribedTypes.includes(type) || type === editingType,
  );

  const changeField = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const startEdit = (preference) => {
    setEditingType(preference.reportType);
    setForm({
      reportType: preference.reportType,
      frequency: preference.frequency,
      active: preference.active,
    });
    setError("");
    setMessage("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.upsertReportPreference({
        reportType: form.reportType,
        frequency: form.frequency,
        active: form.active,
      });
      setMessage(
        editingType
          ? "Report preference updated."
          : "Report subscription saved.",
      );
      resetForm();
      await reload(true);
    } catch (submitError) {
      setError(getErrorMessage(parseApiError(submitError)));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (preference) => {
    const title =
      REPORT_TYPES[preference.reportType]?.title ?? preference.reportType;
    if (!window.confirm(`Unsubscribe from the ${title} report?`)) return;
    setError("");
    setMessage("");
    try {
      await api.deleteReportPreference(preference.reportType);
      setMessage("Report subscription removed.");
      if (editingType === preference.reportType) resetForm();
      await reload(true);
    } catch (removeError) {
      setError(getErrorMessage(parseApiError(removeError)));
    }
  };

  const sendNow = async (preference) => {
    setSending(preference.reportType);
    setError("");
    setMessage("");
    try {
      await api.sendReportNow(preference.reportType);
      const title =
        REPORT_TYPES[preference.reportType]?.title ?? preference.reportType;
      setMessage(`${title} report sent to your email.`);
      await reload(true);
    } catch (sendError) {
      setError(getErrorMessage(parseApiError(sendError)));
    } finally {
      setSending(null);
    }
  };

  // `onStart`/`onStop` let the caller show progress on whichever button kicked
  // the request off, so the panel and the subscription cards never share state.
  const downloadPdf = async (reportType, options, onStart, onStop) => {
    onStart();
    setError("");
    setMessage("");
    try {
      const { blob, fileName } = await api.downloadReportPdf(reportType, options);
      saveBlob(blob, fileName || `${reportType.toLowerCase()}.pdf`);
      const title = REPORT_TYPES[reportType]?.title ?? reportType;
      setMessage(`${title} PDF downloaded.`);
    } catch (downloadError) {
      setError(getErrorMessage(parseApiError(downloadError)));
    } finally {
      onStop();
    }
  };

  const downloadFromPanel = async (event) => {
    event.preventDefault();
    const isCustom = exportForm.window === CUSTOM_RANGE;
    if (isCustom && (!exportForm.from || !exportForm.to)) {
      setError("Choose both a start and an end date for a custom range.");
      return;
    }

    await downloadPdf(
      exportForm.reportType,
      isCustom
        ? { from: exportForm.from, to: exportForm.to }
        : { period: exportForm.window },
      () => setDownloadingPanel(true),
      () => setDownloadingPanel(false),
    );
  };

  const changeExportField = (field, value) =>
    setExportForm((current) => ({ ...current, [field]: value }));

  return (
    <section className="space-y-6">
      <div className="rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 p-8">
        <div className="mb-2 flex items-center gap-2">
          <span className="badge badge-info">REPORTS</span>
        </div>
        <h1 className="mb-3 text-4xl font-bold text-neutral-900">
          Email Reports
        </h1>
        <p className="max-w-md text-neutral-700">
          Receive recurring performance summaries in your inbox. Choose what to
          follow and how often.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(320px,1fr)_2fr]">
        <div className="space-y-6">
          <div className="card">
            <h3 className="mb-6 text-lg font-semibold text-neutral-900">
              {editingType
                ? `Edit ${REPORT_TYPES[editingType]?.title ?? editingType}`
                : "Subscribe to a Report"}
            </h3>
            <form className="space-y-4" onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Report *</label>
                <select
                  className="select"
                  required
                  value={form.reportType}
                  onChange={(event) => changeField("reportType", event.target.value)}
                  disabled={selectableTypes.length === 0}
                >
                  {selectableTypes.map((type) => (
                    <option key={type} value={type}>
                      {REPORT_TYPES[type]?.title ?? type}
                    </option>
                  ))}
                </select>
                {REPORT_TYPES[form.reportType] && (
                  <p className="mt-1 text-xs text-neutral-600">
                    {REPORT_TYPES[form.reportType].description}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Frequency *</label>
                <select
                  className="select"
                  required
                  value={form.frequency}
                  onChange={(event) => changeField("frequency", event.target.value)}
                >
                  {FREQUENCIES.map((frequency) => (
                    <option key={frequency.value} value={frequency.value}>
                      {frequency.label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary-500"
                  checked={form.active}
                  onChange={(event) => changeField("active", event.target.checked)}
                />
                <span className="text-sm text-neutral-700">
                  Deliver automatically on schedule
                </span>
              </label>
              {!form.active && (
                <p className="text-xs text-neutral-600">
                  Paused subscriptions stay configured but won&apos;t be emailed
                  until re-enabled.
                </p>
              )}

              <div className="flex gap-2">
                <button
                  className="btn btn-primary flex-1"
                  disabled={saving || selectableTypes.length === 0}
                >
                  {saving ? (
                    <>
                      <span className="spinner"></span>
                      Saving...
                    </>
                  ) : editingType ? (
                    "Save Changes"
                  ) : (
                    "Subscribe"
                  )}
                </button>
                {editingType && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-neutral-900">
            Download Report
          </h3>
          <p className="mb-6 mt-1 text-sm text-neutral-600">
            Save a PDF copy of a report. No subscription needed.
          </p>
          <form className="space-y-4" onSubmit={downloadFromPanel}>
            <div className="form-group">
              <label className="form-label">Report *</label>
              <select
                className="select"
                required
                value={exportForm.reportType}
                onChange={(event) =>
                  changeExportField("reportType", event.target.value)
                }
              >
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {REPORT_TYPES[type]?.title ?? type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Period *</label>
              <select
                className="select"
                required
                value={exportForm.window}
                onChange={(event) =>
                  changeExportField("window", event.target.value)
                }
              >
                {FREQUENCIES.map((frequency) => (
                  <option key={frequency.value} value={frequency.value}>
                    {frequency.label}
                  </option>
                ))}
                <option value={CUSTOM_RANGE}>Custom range</option>
              </select>
            </div>

            {exportForm.window === CUSTOM_RANGE && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="form-group">
                  <label className="form-label">From *</label>
                  <input
                    type="date"
                    className="input"
                    required
                    max={exportForm.to || today}
                    value={exportForm.from}
                    onChange={(event) =>
                      changeExportField("from", event.target.value)
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">To *</label>
                  <input
                    type="date"
                    className="input"
                    required
                    min={exportForm.from || undefined}
                    max={today}
                    value={exportForm.to}
                    onChange={(event) =>
                      changeExportField("to", event.target.value)
                    }
                  />
                </div>
              </div>
            )}

            <button
              className="btn btn-primary w-full"
              disabled={downloadingPanel}
            >
              {downloadingPanel ? (
                <>
                  <span className="spinner"></span>
                  Preparing PDF...
                </>
              ) : (
                "Download PDF"
              )}
            </button>
            {exportForm.window === CUSTOM_RANGE && (
              <p className="text-xs text-neutral-600">
                Custom ranges are limited to 366 days.
              </p>
            )}
            </form>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Your Subscriptions
          </h3>
          {loading ? (
            <div className="card">
              <p className="text-sm text-neutral-600">
                Loading your subscriptions...
              </p>
            </div>
          ) : preferences.length === 0 ? (
            <div className="card">
              <p className="text-sm text-neutral-600">
                You haven&apos;t subscribed to any reports yet. Use the form to
                opt in.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {preferences.map((preference) => (
                <SubscriptionCard
                  key={preference.id}
                  preference={preference}
                  sending={sending}
                  downloading={downloadingCard}
                  onSendNow={sendNow}
                  onDownloadPdf={() =>
                    downloadPdf(
                      preference.reportType,
                      { period: preference.frequency },
                      () => setDownloadingCard(preference.reportType),
                      () => setDownloadingCard(null),
                    )
                  }
                  onEdit={startEdit}
                  onRemove={remove}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function SubscriptionCard({ preference, sending, onSendNow, onEdit, onRemove }) {
  const meta =
    REPORT_TYPES[preference.reportType] ?? {
      title: preference.reportType,
      description: "",
    };

  return (
    <li className="card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-neutral-900">{meta.title}</h4>
            <span
              className={`badge ${preference.active ? "badge-success" : "badge-neutral"}`}
            >
              {preference.active ? "Active" : "Paused"}
            </span>
            <span className="badge badge-info">
              {FREQUENCY_LABELS[preference.frequency] ?? preference.frequency}
            </span>
          </div>
          {meta.description && (
            <p className="mt-1 text-sm text-neutral-600">{meta.description}</p>
          )}
          <div className="mt-3 grid gap-2 text-xs text-neutral-500 sm:grid-cols-2">
            <span>
              Next run:{" "}
              <span className="font-medium text-neutral-700">
                {formatDateTime(preference.nextRunAt)}
              </span>
            </span>
            <span>
              Last sent:{" "}
              <span className="font-medium text-neutral-700">
                {formatDateTime(preference.lastSentAt)}
              </span>
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1">
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => onSendNow(preference)}
            disabled={sending === preference.reportType}
          >
            {sending === preference.reportType ? (
              <>
                <span className="spinner"></span>
                Sending...
              </>
            ) : (
              "Send Now"
            )}
          </button>
          <button
            type="button"
            className="btn-ghost px-2 py-1 text-sm"
            onClick={() => onEdit(preference)}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn-ghost px-2 py-1 text-sm text-error-600 hover:bg-error-50"
            onClick={() => onRemove(preference)}
          >
            Unsubscribe
          </button>
        </div>
      </div>
    </li>
  );
}
