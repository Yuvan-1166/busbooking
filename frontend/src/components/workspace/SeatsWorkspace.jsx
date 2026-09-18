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
  genderPolicy: "ANY",
};
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function createSeatPreview(busId, dimensions, selectedBus) {
  const seats = [];
  const isDoubleDecker = selectedBus?.deckType === "DOUBLE";
  const deckPrefix = isDoubleDecker ? (dimensions.deckNumber === 1 ? "L" : "U") : "";
  
  for (let row = 1; row <= dimensions.rows; row += 1) {
    for (let column = 1; column <= dimensions.seatsPerRow; column += 1) {
      const position =
        column === 1 || column === dimensions.seatsPerRow
          ? "WINDOW"
          : column === dimensions.aisleAfter
            ? "AISLE"
            : "MIDDLE";
      seats.push({
        localId: `${row}-${column}`,
        busId: Number(busId),
        seatNumber: `${deckPrefix}${row}${letters[column - 1] || column}`,
        deckNumber: dimensions.deckNumber,
        deckName: dimensions.deckName,
        seatType: "SEAT",
        position,
        genderPolicy: "ANY",
      });
    }
  }
  return seats;
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
    <section className="border border-[#e7e5dc] bg-paper p-7 max-[600px]:p-5">
      <div className="mb-[26px] flex items-end justify-between gap-5 max-[700px]:block">
        <div>
          <p className="mb-3.5 font-mono text-[10px] tracking-[.13em] text-green">
            SEAT LAYOUT
          </p>
          <h2 className="m-0 font-display text-[29px] font-semibold text-ink">
            Seats
          </h2>
          <p className="mt-1 text-xs text-muted">
            Use a pre-built template or manually set bus size and create seats.
          </p>
        </div>
        <label className="grid min-w-[240px] gap-1.5 font-mono text-[10px] uppercase text-muted max-[700px]:mt-[18px]">
          Bus
          <select
            className="border border-line bg-paper p-2.5 text-xs normal-case text-ink"
            value={selectedBusId}
            onChange={selectBus}
          >
            {buses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.registrationNumber} · {bus.model}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Template Selection Banner */}
      <div className="mb-6 border-2 border-orange bg-[#fff8f5] p-5">
        <div className="flex items-center justify-between gap-4 max-[700px]:block">
          <div>
            <p className="mb-1 font-display text-[19px] font-semibold text-ink">
              ✨ Quick Setup with Templates
            </p>
            <p className="text-xs text-muted">
              Choose from 9 professional bus layouts including single-deck,
              double-decker, sleeper, and luxury coaches. All templates include
              proper seat numbering and female-reserved seating.
            </p>
          </div>
          <button
            type="button"
            className="mt-0 border-0 bg-orange px-5 py-3 font-bold text-white hover:bg-[#d8503d] max-[700px]:mt-4 max-[700px]:w-full"
            onClick={() => setShowTemplateGallery(true)}
            disabled={applyingTemplate}
          >
            {applyingTemplate ? "Applying..." : "Browse Templates →"}
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-[minmax(200px,.8fr)_1.6fr] items-end gap-6 border border-line bg-[#f4f5ef] p-5 max-[800px]:grid-cols-1">
        <div>
          <p className="mb-3.5 font-mono text-[10px] tracking-[.13em] text-green">
            CREATE MULTIPLE SEATS
          </p>
          <h3 className="mb-1 font-display text-[23px] font-semibold text-ink">
            Manual dimensions
          </h3>
          <p className="text-[11px] leading-4 text-muted">
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
          <label className="grid gap-1.5 font-mono text-[9px] uppercase text-muted">
            Rows
            <input
              className="border border-line bg-paper p-2 text-ink"
              type="number"
              min="1"
              max="40"
              value={dimensions.rows}
              onChange={(event) =>
                setDimensions({ ...dimensions, rows: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1.5 font-mono text-[9px] uppercase text-muted">
            Seats per row
            <input
              className="border border-line bg-paper p-2 text-ink"
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
          <label className="grid gap-1.5 font-mono text-[9px] uppercase text-muted">
            Aisle after column
            <input
              className="border border-line bg-paper p-2 text-ink"
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
              <label className="grid gap-1.5 font-mono text-[9px] uppercase text-muted">
                Deck Number
                <select
                  className="border border-line bg-paper p-2 text-ink"
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
              <label className="grid gap-1.5 font-mono text-[9px] uppercase text-muted">
                Deck Name
                <input
                  className="border border-line bg-paper p-2 text-ink"
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
            className="border-0 bg-orange px-3 py-3 text-left font-bold text-white max-[800px]:col-span-full max-[500px]:col-auto"
            type="submit"
          >
            Preview {Number(dimensions.rows) * Number(dimensions.seatsPerRow)}{" "}
            seats <span className="float-right text-lg">→</span>
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
          <aside className="border border-line bg-[#fffaf4] p-6">
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
    <section className="border border-line bg-[#f4f5ef] p-[22px]">
      <div className="mb-5 flex justify-between gap-5 max-[800px]:block">
        <div>
          <p className="mb-3.5 font-mono text-[10px] tracking-[.13em] text-green">
            PREVIEW
          </p>
          <h3 className="mb-1 font-display text-[23px] font-semibold text-ink">
            {seats.length} seats
          </h3>
          <p className="text-[11px] text-muted">
            Review the generated names and seat properties before saving.
          </p>
        </div>
        <div className="mt-0 flex items-start gap-[15px] max-[800px]:mt-4">
          <button
            type="button"
            className="border-0 border-b border-orange bg-transparent p-0 pb-1 text-[11px] text-orange"
            onClick={onCancel}
          >
            Back to layout
          </button>
          <button
            type="button"
            className="border-0 bg-orange px-3 py-3 text-left font-bold text-white"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Saving seats..." : "Save all seats"}{" "}
            <span className="ml-4 text-lg">→</span>
          </button>
        </div>
      </div>
      <div className="grid gap-2 overflow-x-auto">
        {rows.map((row) => (
          <div
            className="grid min-w-[680px] grid-cols-[55px_repeat(auto-fit,minmax(150px,1fr))] items-stretch gap-2"
            key={row}
          >
            <span className="self-center font-mono text-[10px] text-muted">
              Row {row}
            </span>
            {seats
              .filter(
                (seat) => (seat.seatNumber.match(/^\d+/)?.[0] || "0") === row,
              )
              .map((seat) => (
                <div
                  className={`grid gap-1.5 border p-2 ${seat.seatType === "SLEEPER" ? "border-[#d1b875] bg-[#e9e0ca]" : seat.genderPolicy === "FEMALE_ONLY" || seat.genderPolicy === "FEMALE_PREFERRED" ? "border-[#b49ec4] bg-[#ede8f5]" : seat.genderPolicy === "MALE_ONLY" || seat.genderPolicy === "MALE_PREFERRED" ? "border-[#7fb1d4] bg-[#ddeef8]" : "border-[#b7c9ae] bg-[#e4f0df]"}`}
                  key={seat.localId}
                >
                  <input
                    className="w-full border-0 border-b border-[rgba(32,38,34,.18)] bg-transparent p-1 font-mono text-[13px] text-ink outline-0"
                    aria-label={`Seat name ${seat.seatNumber}`}
                    value={seat.seatNumber}
                    onChange={(event) =>
                      onChange(seat.localId, { seatNumber: event.target.value })
                    }
                  />
                  <select
                    className="w-full border-0 border-b border-[rgba(32,38,34,.18)] bg-transparent p-1 text-[10px] text-ink outline-0"
                    value={seat.seatType}
                    onChange={(event) =>
                      onChange(seat.localId, { seatType: event.target.value })
                    }
                  >
                    <option value="SEAT">Seat</option>
                    <option value="SLEEPER">Sleeper</option>
                  </select>
                  <select
                    className="w-full border-0 border-b border-[rgba(32,38,34,.18)] bg-transparent p-1 text-[10px] text-ink outline-0"
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
                    className="w-full border-0 border-b border-[rgba(32,38,34,.18)] bg-transparent p-1 text-[10px] text-ink outline-0"
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
          <p className="mb-3.5 font-mono text-[10px] tracking-[.13em] text-green">
            {isEditing ? "EDIT SEAT" : "ADD ONE SEAT"}
          </p>
          <h3 className="m-0 font-display text-[22px] font-semibold text-ink">
            {isEditing
              ? `Seat ${selectedSeat.seatNumber || selectedSeat.id}`
              : "Single seat"}
          </h3>
        </div>
        {isEditing && (
          <button
            type="button"
            className="border-0 bg-transparent text-[22px] text-muted"
            onClick={onCancel}
            aria-label="Cancel editing"
          >
            ×
          </button>
        )}
      </div>
      <form className="grid gap-3.5" onSubmit={onSubmit}>
        <label className="grid gap-1.5 font-mono text-[10px] uppercase text-muted">
          Seat number
          <input
            className="w-full border-0 border-b border-line bg-transparent py-2 text-ink outline-0"
            required
            value={form.seatNumber}
            placeholder="1A"
            onChange={(event) =>
              onChange({ ...form, seatNumber: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1.5 font-mono text-[10px] uppercase text-muted">
          Deck Number
          <input
            className="w-full border-0 border-b border-line bg-transparent py-2 text-ink outline-0"
            type="number"
            min="1"
            max="2"
            value={form.deckNumber || 1}
            onChange={(event) =>
              onChange({ ...form, deckNumber: Number(event.target.value) })
            }
          />
        </label>
        <label className="grid gap-1.5 font-mono text-[10px] uppercase text-muted">
          Deck Name
          <input
            className="w-full border-0 border-b border-line bg-transparent py-2 text-ink outline-0"
            type="text"
            placeholder="Lower Deck"
            value={form.deckName || ""}
            onChange={(event) =>
              onChange({ ...form, deckName: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1.5 font-mono text-[10px] uppercase text-muted">
          Type
          <select
            className="w-full border-0 border-b border-line bg-transparent py-2 text-ink outline-0"
            value={form.seatType}
            onChange={(event) =>
              onChange({ ...form, seatType: event.target.value })
            }
          >
            <option value="SEAT">Seat</option>
            <option value="SLEEPER">Sleeper</option>
          </select>
        </label>
        <label className="grid gap-1.5 font-mono text-[10px] uppercase text-muted">
          Position
          <select
            className="w-full border-0 border-b border-line bg-transparent py-2 text-ink outline-0"
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
        <label className="grid gap-1.5 font-mono text-[10px] uppercase text-muted">
          Gender reservation
          <select
            className="w-full border-0 border-b border-line bg-transparent py-2 text-ink outline-0"
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
        <button
          className="border-0 bg-orange px-[17px] py-3.5 text-left font-bold text-white disabled:opacity-45"
          disabled={saving}
        >
          {saving ? "Saving..." : isEditing ? "Save changes" : "Add seat"}{" "}
          <span className="float-right text-lg">→</span>
        </button>
        {isEditing && (
          <button
            type="button"
            className="mt-2 w-full border border-[#d79b8b] bg-transparent p-2.5 text-[11px] text-[#8c3e2d]"
            onClick={onDelete}
            disabled={saving}
          >
            Delete seat
          </button>
        )}
      </form>
      <p className="mt-[18px] text-[11px] leading-4 text-muted">
        Select a seat in the layout to edit it.
      </p>
    </>
  );
}
