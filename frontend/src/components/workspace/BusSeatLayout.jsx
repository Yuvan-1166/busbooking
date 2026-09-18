import { useState, useMemo } from "react";
import BusSilhouette from "./BusSilhouette";

export default function BusSeatLayout({
  bus,
  seats,
  selectedSeat,
  selectedSeats = [],
  onSelect,
  multiSelect = false,
  disabled = false,
}) {
  const [selectedDeck, setSelectedDeck] = useState(1);

  // Check if bus is double-decker
  const isDoubleDecker = bus.deckType === "DOUBLE";
  const hasMultipleDecks = useMemo(
    () => seats.some((seat) => seat.deckNumber && seat.deckNumber > 1),
    [seats]
  );
  const showDualView = isDoubleDecker || hasMultipleDecks;

  // Get unique decks
  const decks = useMemo(() => {
    const deckSet = new Set(seats.map((s) => s.deckNumber || 1));
    return Array.from(deckSet).sort();
  }, [seats]);

  // Group seats by deck
  const seatsByDeck = useMemo(() => {
    const grouped = {};
    for (const seat of seats) {
      const deck = seat.deckNumber || 1;
      if (!grouped[deck]) {
        grouped[deck] = [];
      }
      grouped[deck].push(seat);
    }
    return grouped;
  }, [seats]);

  // Get deck info
  const getDeckInfo = (deckNum) => {
    const deckSeats = seatsByDeck[deckNum] || [];
    const deckName = deckSeats[0]?.deckName || `Deck ${deckNum}`;
    return { deckName, seats: deckSeats };
  };

  return (
    <section
      className="min-w-0 border border-line bg-[#f4f5ef] p-6"
      aria-label={`${bus.registrationNumber} seat layout`}
    >
      {/* Header */}
      <div className="mb-6 flex justify-between gap-[18px]">
        <div>
          <span className="font-mono text-[10px] tracking-[.13em] text-green">
            BUS {bus.id}
          </span>

          <h3 className="mb-1 mt-1 font-display text-[23px] font-semibold text-ink">
            {bus.registrationNumber}
            {showDualView && (
              <span className="ml-2 rounded-full bg-orange px-2 py-1 font-mono text-[10px] font-semibold text-white">
                🚌 DOUBLE DECKER
              </span>
            )}
          </h3>

          <p className="m-0 text-[11px] text-muted">
            {bus.model} · {seats.length} seats total
            {showDualView &&
              ` · ${seatsByDeck[1]?.length || 0} lower, ${seatsByDeck[2]?.length || 0} upper`}
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-start gap-2.5 text-[10px] text-muted">
          <span className="flex items-center gap-1">
            <i className="h-8 w-8 rounded-[7px] border border-[#b7c9ae] bg-[#e4f0df]" />
            Any
          </span>
          <span className="flex items-center gap-1">
            <i className="h-9 w-8 rounded-[11px] border border-[#d1b875] bg-[#e9e0ca]" />
            Sleeper
          </span>
          <span className="flex items-center gap-1">
            <i className="h-8 w-8 rounded-[7px] border border-[#b49ec4] bg-[#ede8f5]" />
            Female
          </span>
          <span className="flex items-center gap-1">
            <i className="h-8 w-8 rounded-[7px] border border-[#7fb1d4] bg-[#ddeef8]" />
            Male
          </span>
        </div>
      </div>

      {/* Bus Silhouette(s) */}
      {showDualView && decks.length > 1 ? (
        /* Dual Silhouette View for Double-Decker */
        <div className="mb-6">
          <div className="mb-4 grid grid-cols-2 gap-4 max-[900px]:grid-cols-1">
            {decks.map((deckNum) => {
              const { deckName, seats: deckSeats } = getDeckInfo(deckNum);
              return (
                <div key={deckNum} className="flex flex-col items-center">
                  <div className="mb-3 text-center">
                    <span className="inline-block rounded-full border-2 border-orange bg-[#fff8f5] px-3 py-1 font-mono text-[11px] font-semibold text-orange">
                      {deckName} ({deckSeats.length} seats)
                    </span>
                  </div>
                  <BusSilhouette
                    deckNumber={deckNum}
                    deckName={deckName}
                    seats={deckSeats}
                    selectedSeat={selectedSeat}
                    selectedSeats={selectedSeats}
                    onSelect={onSelect}
                    multiSelect={multiSelect}
                    disabled={disabled}
                    compact={true}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Single Silhouette View */
        <div className="mb-6 flex justify-center">
          <BusSilhouette
            deckNumber={1}
            deckName={null}
            seats={seats}
            selectedSeat={selectedSeat}
            selectedSeats={selectedSeats}
            onSelect={onSelect}
            multiSelect={multiSelect}
            disabled={disabled}
            compact={false}
          />
        </div>
      )}

      {/* Seat Statistics */}
      <div className="flex flex-wrap gap-4 font-mono text-[10px] uppercase text-muted">
        <span>
          <strong className="mr-1 text-base text-ink">
            {seats.filter((seat) => seat.seatType === "SEAT").length}
          </strong>
          seats
        </span>

        <span>
          <strong className="mr-1 text-base text-ink">
            {seats.filter((seat) => seat.seatType === "SLEEPER").length}
          </strong>
          sleepers
        </span>

        <span>
          <strong className="mr-1 text-base text-ink">
            {seats.filter((seat) => seat.position === "WINDOW").length}
          </strong>
          window
        </span>

        <span>
          <strong className="mr-1 text-base text-ink">
            {seats.filter((seat) => seat.position === "AISLE").length}
          </strong>
          aisle
        </span>

        {seats.some(
          (seat) =>
            seat.genderPolicy === "FEMALE_ONLY" ||
            seat.genderPolicy === "FEMALE_PREFERRED"
        ) && (
          <span>
            <strong className="mr-1 text-base text-[#6b4e8a]">
              {
                seats.filter(
                  (seat) =>
                    seat.genderPolicy === "FEMALE_ONLY" ||
                    seat.genderPolicy === "FEMALE_PREFERRED"
                ).length
              }
            </strong>
            Female
          </span>
        )}

        {seats.some(
          (seat) =>
            seat.genderPolicy === "MALE_ONLY" ||
            seat.genderPolicy === "MALE_PREFERRED"
        ) && (
          <span>
            <strong className="mr-1 text-base text-[#2a6a9a]">
              {
                seats.filter(
                  (seat) =>
                    seat.genderPolicy === "MALE_ONLY" ||
                    seat.genderPolicy === "MALE_PREFERRED"
                ).length
              }
            </strong>
            Male
          </span>
        )}
      </div>
    </section>
  );
}
