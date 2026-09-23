import { useEffect, useMemo, useState } from "react";
import BusSeatLayout from "./BusSeatLayout";
import StateMessage from "../common/StateMessage";
import TemplateGallery from "./TemplateGallery";
import { api } from "../../api";

const emptyDimensions = { rows: 10, seatsPerRow: 4, aisleAfter: 2, deckNumber: 1, deckName: "Lower Deck" };
const emptySeat = {
  busId: "",
  seatNumber: "",
  deckNumber: 1,
  deckName: "",
  seatType: "SEAT",
  position: "WINDOW",
  aisleAfter: null,
  genderPolicy: "ANY",
};
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function createSeatPreview(busId, dimensions, selectedBus) {
  const seats = [];
  const isDoubleDecker = selectedBus?.deckType === "DOUBLE";
  const deckPrefix = isDoubleDecker ? (dimensions.deckNumber === 1 ? "L" : "U") : "";

  for (let row = 1; row <= dimensions.rows; row += 1) {
    for (let column = 1; column <= dimensions.seatsPerRow; column += 1) {
      const position = getSeatPosition(
        column,
        dimensions.seatsPerRow,
        dimensions.aisleAfter,
      );
      seats.push({
        localId: `${row}-${column}`,
        busId: Number(busId),
        seatNumber: `${deckPrefix}${row}${letters[column - 1] || column}`,
        deckNumber: dimensions.deckNumber,
        deckName: dimensions.deckName,
        seatType: "SEAT",
        position,
        aisleAfter: Number(dimensions.aisleAfter),
        genderPolicy: "ANY",
      });
    }
  }
  return seats;
}

/**
 * Position for a seat at `column` in a row of `seatsPerRow` seats with the
 * aisle placed right after `aisleAfter` columns.
 * - Column 1 and the last column are window seats (bus walls).
 * - Columns immediately adjacent to the aisle (one on each side) are aisle seats.
 * - Everything else is a middle seat.
 */
function getSeatPosition(column, seatsPerRow, aisleAfter) {
  if (column === 1 || column === seatsPerRow) return "WINDOW";
  if (column === aisleAfter || column === aisleAfter + 1) return "AISLE";
  return "MIDDLE";
}

export default function SeatsWorkspace({
  buses,
  seats,
  onCreate,
  onCreateBatch,
  onUpdate,
  onDelete,
  saving,
}) {
  const [selectedBusId, setSelectedBusId] = useState(
    String(buses[0]?.id || ""),
  );
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [form, setForm] = useState({
    ...emptySeat,
    busId: String(buses[0]?.id || ""),
  });
  const [dimensions, setDimensions] = useState(emptyDimensions);
  const [previewSeats, setPreviewSeats] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const selectedBus = buses.find((bus) => String(bus.id) === selectedBusId);
  const busSeats = useMemo(
    () => seats.filter((seat) => String(seat.busId) === selectedBusId),
    [seats, selectedBusId],
  );
  const isEditing = Boolean(selectedSeat);

  useEffect(() => {
    if (!selectedBusId && buses[0]) {
      setSelectedBusId(String(buses[0].id));
      setForm({ ...emptySeat, busId: String(buses[0].id) });
    }
  }, [buses, selectedBusId]);

  const selectBus = (event) => {
    const busId = event.target.value;
    setSelectedBusId(busId);
    setSelectedSeat(null);
    setPreviewMode(false);
    setPreviewSeats([]);
    setForm({ ...emptySeat, busId });
  };

  const generatePreview = (event) => {
    event.preventDefault();
    const next = createSeatPreview(selectedBusId, {
      rows: Number(dimensions.rows),
      seatsPerRow: Number(dimensions.seatsPerRow),
      aisleAfter: Number(dimensions.aisleAfter),
      deckNumber: Number(dimensions.deckNumber),
      deckName: dimensions.deckName,
    }, selectedBus);
    setPreviewSeats(next);
    setPreviewMode(true);
  };

  const updatePreviewSeat = (localId, changes) =>
    setPreviewSeats((current) =>
      current.map((seat) =>
        seat.localId === localId ? { ...seat, ...changes } : seat,
      ),
    );

  const savePreview = async () => {
    if (!previewSeats.length) return;
    const saved = await onCreateBatch(
      previewSeats.map(({ localId, ...seat }) => seat),
    );
    if (saved) {
      setPreviewSeats([]);
      setPreviewMode(false);
    }
  };

  const selectSeat = (seat) => {
    if (!seat.id) return;
    setSelectedSeat(seat);
    setForm({
      busId: String(seat.busId),
      seatNumber: seat.seatNumber || "",
      seatType: seat.seatType || "SEAT",
      position: seat.position || "WINDOW",
      aisleAfter: seat.aisleAfter ?? null,
      genderPolicy: seat.genderPolicy || "ANY",
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (isEditing) {
      const saved = await onUpdate(selectedSeat.id, {
        ...form,
        busId: Number(form.busId),
      });
      if (!saved) return;
      setSelectedSeat(null);
      setForm({ ...emptySeat, busId: selectedBusId });
      return;
    }
    const saved = await onCreate({ ...form, busId: Number(form.busId) });
    if (saved) setForm({ ...emptySeat, busId: selectedBusId });
  };

  const remove = async () => {
    if (!selectedSeat) return;
    const deleted = await onDelete(selectedSeat.id);
    if (!deleted) return;
    setSelectedSeat(null);
    setForm({ ...emptySeat, busId: selectedBusId });
  };

  const handleApplyTemplate = async (template) => {
    if (!selectedBusId) return;

    const hasExistingSeats = busSeats.length > 0;
    let clearExisting = false;

    if (hasExistingSeats) {
      const confirmed = window.confirm(
        `This bus already has ${busSeats.length} seat(s). Do you want to replace them with the template?\n\nClick OK to replace existing seats, or Cancel to keep them and add template seats.`
      );
      clearExisting = confirmed;
    }

    try {
      setApplyingTemplate(true);
      setShowTemplateGallery(false);

      // Apply template via API
      await api.applySeatTemplate(template.id, Number(selectedBusId), clearExisting);

      // Refresh seats by triggering parent to reload
      window.location.reload(); // Simple approach - you could also use a callback to refresh
    } catch (err) {
      alert("Failed to apply template: " + (err.message || "Unknown error"));
      setApplyingTemplate(false);
    }
  };

  if (!buses.length)
    return <StateMessage>Add a bus before adding seats.</StateMessage>;

  return (
    <section className="card p-7 max-[600px]:p-5">
      <div className="mb-[26px] flex items-end justify-between gap-5 max-[700px]:block">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Seat Layout
          </p>
          <h2 className="m-0 text-2xl font-semibold text-neutral-900">
            Seats
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Use a pre-built template or manually set bus size and create seats.
          </p>
        </div>
        <label className="grid min-w-[240px] gap-1.5 max-[700px]:mt-[18px]">
          <span className="text-sm font-medium text-neutral-700">Bus</span>
          <select className="select" value={selectedBusId} onChange={selectBus}>
            {buses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.registrationNumber} · {bus.model}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Template Selection Banner */}
      <div className="mb-6 rounded-lg border border-neutral-200 bg-primary-50 p-5">
        <div className="flex items-center justify-between gap-4 max-[700px]:block">
          <div>
            <p className="mb-1 font-semibold text-neutral-900">
              Quick Setup with Templates
            </p>
            <p className="text-sm text-neutral-600">
              Choose from 9 professional bus layouts including single-deck,
              double-decker, sleeper, and luxury coaches. All templates include
              proper seat numbering and female-reserved seating.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary max-[700px]:mt-4 max-[700px]:w-full"
            onClick={() => setShowTemplateGallery(true)}
            disabled={applyingTemplate}
          >
            {applyingTemplate ? "Applying..." : "Browse Templates"}
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-[minmax(200px,.8fr)_1.6fr] items-end gap-6 rounded-lg border border-neutral-200 bg-neutral-50 p-5 max-[800px]:grid-cols-1">
        <div>
          <p className="mb-1 text-sm font-semibold text-neutral-900">
            Manual dimensions
          </p>
          <p className="text-xs leading-4 text-neutral-500">
            Or create seats manually. Labels are generated automatically. You
            can edit them before saving.
          </p>
        </div>
        <form
          className="grid items-end gap-2.5 max-[500px]:grid-cols-1"
          style={{
            gridTemplateColumns: selectedBus?.deckType === "DOUBLE" 
              ? "repeat(5, 1fr) auto" 
              : "repeat(3, 1fr) auto"
          }}
          onSubmit={generatePreview}
        >
          <label className="grid gap-1.5 text-xs font-medium text-neutral-700">
            Rows
            <input
              className="input"
              type="number"
              min="1"
              max="40"
              value={dimensions.rows}
              onChange={(event) =>
                setDimensions({ ...dimensions, rows: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-neutral-700">
            Seats per row
            <input
              className="input"
              type="number"
              min="2"
              max="8"
              value={dimensions.seatsPerRow}
              onChange={(event) =>
                setDimensions({
                  ...dimensions,
                  seatsPerRow: event.target.value,
                })
              }
            />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-neutral-700">
            Aisle after column
            <input
              className="input"
              type="number"
              min="1"
              max={Math.max(1, dimensions.seatsPerRow - 1)}
              value={dimensions.aisleAfter}
              onChange={(event) =>
                setDimensions({ ...dimensions, aisleAfter: event.target.value })
              }
            />
          </label>
          {selectedBus?.deckType === "DOUBLE" && (
            <>
              <label className="grid gap-1.5 text-xs font-medium text-neutral-700">
                Deck Number
                <select
                  className="select"
                  value={dimensions.deckNumber}
                  onChange={(event) => {
                    const deckNum = Number(event.target.value);
                    setDimensions({
                      ...dimensions,
                      deckNumber: deckNum,
                      deckName: deckNum === 1 ? "Lower Deck" : "Upper Deck",
                    });
                  }}
                >
                  <option value="1">1 - Lower</option>
                  <option value="2">2 - Upper</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-neutral-700">
                Deck Name
                <input
                  className="input"
                  type="text"
                  value={dimensions.deckName}
                  onChange={(event) =>
                    setDimensions({ ...dimensions, deckName: event.target.value })
                  }
                />
              </label>
            </>
          )}
          <button
            className="btn btn-primary max-[800px]:col-span-full max-[500px]:col-auto"
            type="submit"
          >
            Preview {Number(dimensions.rows) * Number(dimensions.seatsPerRow)}{" "}
            seats
          </button>
        </form>
      </div>
      {previewMode ? (
        <BatchPreview
          seats={previewSeats}
          onChange={updatePreviewSeat}
          onCancel={() => setPreviewMode(false)}
          onSave={savePreview}
          saving={saving}
        />
      ) : (
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(230px,.6fr)] items-start gap-6 max-[700px]:grid-cols-1">
          <div>
            {selectedBus && (
              <BusSeatLayout
                bus={selectedBus}
                seats={busSeats}
                selectedSeat={selectedSeat}
                onSelect={selectSeat}
              />
            )}
          </div>
          <aside className="rounded-lg border border-neutral-200 bg-neutral-50 p-6">
            <SeatEditor
              isEditing={isEditing}
              selectedSeat={selectedSeat}
              form={form}
              onChange={setForm}
              onSubmit={submit}
              onDelete={remove}
              onCancel={() => {
                setSelectedSeat(null);
                setForm({ ...emptySeat, busId: selectedBusId });
              }}
              saving={saving}
            />
          </aside>
        </div>
      )}
      
      {/* Template Gallery Modal */}
      {showTemplateGallery && (
        <TemplateGallery
          onSelectTemplate={handleApplyTemplate}
          onClose={() => setShowTemplateGallery(false)}
        />
      )}
    </section>
  );
}

function BatchPreview({ seats, onChange, onCancel, onSave, saving }) {
  const rows = [
    ...new Set(seats.map((seat) => seat.seatNumber.match(/^\d+/)?.[0] || "0")),
  ];
  return (
    <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-[22px]">
      <div className="mb-5 flex justify-between gap-5 max-[800px]:block">
        <div>
          <p className="mb-1 text-sm font-semibold text-neutral-900">
            {seats.length} seats
          </p>
          <p className="text-xs text-neutral-500">
            Review the generated names and seat properties before saving.
          </p>
        </div>
        <div className="mt-0 flex items-center gap-3 max-[800px]:mt-4">
          <button
            type="button"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
            onClick={onCancel}
          >
            Back to layout
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Saving seats..." : "Save all seats"}
          </button>
        </div>
      </div>
      <div className="grid gap-2 overflow-x-auto">
        {rows.map((row) => (
          <div
            className="grid min-w-[680px] grid-cols-[55px_repeat(auto-fit,minmax(150px,1fr))] items-stretch gap-2"
            key={row}
          >
            <span className="self-center text-xs font-medium text-neutral-500">
              Row {row}
            </span>
            {seats
              .filter(
                (seat) => (seat.seatNumber.match(/^\d+/)?.[0] || "0") === row,
              )
              .map((seat) => (
                <div
                  className="grid gap-1.5 rounded-md border border-neutral-200 bg-white p-2"
                  key={seat.localId}
                >
                  <input
                    className="w-full border-0 border-b border-neutral-200 bg-transparent p-1 text-sm font-medium text-neutral-900 outline-0 focus:border-primary-500"
                    aria-label={`Seat name ${seat.seatNumber}`}
                    value={seat.seatNumber}
                    onChange={(event) =>
                      onChange(seat.localId, { seatNumber: event.target.value })
                    }
                  />
                  <select
                    className="w-full border-0 border-b border-neutral-200 bg-transparent p-1 text-xs text-neutral-900 outline-0 focus:border-primary-500"
                    value={seat.seatType}
                    onChange={(event) =>
                      onChange(seat.localId, { seatType: event.target.value })
                    }
                  >
                    <option value="SEAT">Seat</option>
                    <option value="SLEEPER">Sleeper</option>
                  </select>
                  <select
                    className="w-full border-0 border-b border-neutral-200 bg-transparent p-1 text-xs text-neutral-900 outline-0 focus:border-primary-500"
                    value={seat.position}
                    onChange={(event) =>
                      onChange(seat.localId, { position: event.target.value })
                    }
                  >
                    <option value="WINDOW">Window</option>
                    <option value="AISLE">Aisle</option>
                    <option value="MIDDLE">Middle</option>
                  </select>
                  <select
                    className="w-full border-0 border-b border-neutral-200 bg-transparent p-1 text-xs text-neutral-900 outline-0 focus:border-primary-500"
                    value={seat.genderPolicy || "ANY"}
                    onChange={(event) =>
                      onChange(seat.localId, {
                        genderPolicy: event.target.value,
                      })
                    }
                  >
                    <option value="ANY">Any</option>
                    <option value="FEMALE_PREFERRED">Female preferred</option>
                    <option value="FEMALE_ONLY">Female only</option>
                    <option value="MALE_PREFERRED">Male preferred</option>
                    <option value="MALE_ONLY">Male only</option>
                  </select>
                </div>
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function SeatEditor({
  isEditing,
  selectedSeat,
  form,
  onChange,
  onSubmit,
  onDelete,
  onCancel,
  saving,
}) {
  return (
    <>
      <div className="mb-5 flex justify-between gap-[18px]">
        <div>
          <p className="mb-1 text-sm font-semibold text-neutral-900">
            {isEditing
              ? `Seat ${selectedSeat.seatNumber || selectedSeat.id}`
              : "Single seat"}
          </p>
          <p className="text-xs text-neutral-500">
            {isEditing
              ? "Edit this seat's details."
              : "Add one seat manually to the selected bus."}
          </p>
        </div>
        {isEditing && (
          <button
            type="button"
            className="text-xl leading-none text-neutral-500 hover:text-neutral-900"
            onClick={onCancel}
            aria-label="Cancel editing"
          >
            ×
          </button>
        )}
      </div>
      <form className="grid gap-3.5" onSubmit={onSubmit}>
        <label className="grid gap-1.5 text-xs font-medium text-neutral-700">
          Seat number
          <input
            className="w-full border-0 border-b border-neutral-200 bg-transparent py-2 text-sm text-neutral-900 outline-0 focus:border-primary-500"
            required
            value={form.seatNumber}
            placeholder="1A"
            onChange={(event) =>
              onChange({ ...form, seatNumber: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-neutral-700">
          Deck Number
          <input
            className="w-full border-0 border-b border-neutral-200 bg-transparent py-2 text-sm text-neutral-900 outline-0 focus:border-primary-500"
            type="number"
            min="1"
            max="2"
            value={form.deckNumber || 1}
            onChange={(event) =>
              onChange({ ...form, deckNumber: Number(event.target.value) })
            }
          />
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-neutral-700">
          Deck Name
          <input
            className="w-full border-0 border-b border-neutral-200 bg-transparent py-2 text-sm text-neutral-900 outline-0 focus:border-primary-500"
            type="text"
            placeholder="Lower Deck"
            value={form.deckName || ""}
            onChange={(event) =>
              onChange({ ...form, deckName: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-neutral-700">
          Type
          <select
            className="w-full border-0 border-b border-neutral-200 bg-transparent py-2 text-sm text-neutral-900 outline-0 focus:border-primary-500"
            value={form.seatType}
            onChange={(event) =>
              onChange({ ...form, seatType: event.target.value })
            }
          >
            <option value="SEAT">Seat</option>
            <option value="SLEEPER">Sleeper</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-neutral-700">
          Position
          <select
            className="w-full border-0 border-b border-neutral-200 bg-transparent py-2 text-sm text-neutral-900 outline-0 focus:border-primary-500"
            value={form.position}
            onChange={(event) =>
              onChange({ ...form, position: event.target.value })
            }
          >
            <option value="WINDOW">Window</option>
            <option value="AISLE">Aisle</option>
            <option value="MIDDLE">Middle</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-neutral-700">
          Gender reservation
          <select
            className="w-full border-0 border-b border-neutral-200 bg-transparent py-2 text-sm text-neutral-900 outline-0 focus:border-primary-500"
            value={form.genderPolicy || "ANY"}
            onChange={(event) =>
              onChange({ ...form, genderPolicy: event.target.value })
            }
          >
            <option value="ANY">Any — open to all</option>
            <option value="FEMALE_PREFERRED">Female preferred</option>
            <option value="FEMALE_ONLY">Female only (reserved)</option>
            <option value="MALE_PREFERRED">Male preferred</option>
            <option value="MALE_ONLY">Male only (reserved)</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-neutral-700">
          Aisle after column
          <input
            className="w-full border-0 border-b border-neutral-200 bg-transparent py-2 text-sm text-neutral-900 outline-0 focus:border-primary-500"
            type="number"
            min="1"
            placeholder="e.g. 2 for 2+2"
            value={form.aisleAfter ?? ""}
            onChange={(event) =>
              onChange({
                ...form,
                aisleAfter:
                  event.target.value === ""
                    ? null
                    : Number(event.target.value),
              })
            }
          />
        </label>
        <button className="btn btn-primary w-full" disabled={saving}>
          {saving ? "Saving..." : isEditing ? "Save changes" : "Add seat"}
        </button>
        {isEditing && (
          <button
            type="button"
            className="mt-2 w-full rounded border border-error-200 bg-transparent p-2.5 text-sm font-semibold text-error-600 transition-colors hover:bg-error-50"
            onClick={onDelete}
            disabled={saving}
          >
            Delete seat
          </button>
        )}
      </form>
      <p className="mt-[18px] text-xs leading-4 text-neutral-500">
        Select a seat in the layout to edit it.
      </p>
    </>
  );
}
