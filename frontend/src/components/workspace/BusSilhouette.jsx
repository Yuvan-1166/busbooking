/**
 * BusSilhouette - Modular component for rendering bus seat layout
 * 
 * Features:
 * - Deck-aware rendering (single/double-decker)
 * - Reusable for operator and passenger views
 * - Responsive design
 * - Optimized seat grouping algorithm
 */

export default function BusSilhouette({
  deckNumber,
  deckName,
  seats,
  selectedSeat,
  selectedSeats = [],
  onSelect,
  multiSelect = false,
  disabled = false,
  compact = false,
}) {
  // Optimize: Group seats by row using efficient algorithm
  const rows = groupSeatsByRow(seats);

  return (
    <div
      className={`relative flex flex-col overflow-visible rounded-[48px_48px_22px_22px] border-2 border-[#aebaa8] bg-[#e7ece3] shadow-[inset_0_0_0_1px_rgba(255,255,255,.45)] ${
        compact ? "h-[480px] w-[200px] px-2 pb-4 pt-2" : "h-[620px] w-[250px] px-3 pb-5 pt-3"
      }`}
    >
      {/* Front / Driver Section */}
      <FrontSection compact={compact} />

      {/* Deck Label (for double-decker) */}
      {deckName && (
        <div className="mb-2 flex items-center justify-center border-b border-dashed border-[#b8c5b1] pb-2">
          <span className="rounded-full bg-primary-600 px-2 py-0.5 text-[9px] font-semibold text-white">
            {deckName}
          </span>
        </div>
      )}

      {/* Seat Area */}
      <div
        className="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden"
        style={{
          gridTemplateRows: `repeat(${rows.length || 1}, ${compact ? "32px" : "38px"})`,
          alignContent: "space-between",
        }}
      >
        {rows.length ? (
          rows.map((row) => (
            <SeatRow
              key={row[0]?.seatNumber || row[0]?.id}
              row={row}
              selectedSeat={selectedSeat}
              selectedSeats={selectedSeats}
              onSelect={onSelect}
              multiSelect={multiSelect}
              disabled={disabled}
              compact={compact}
            />
          ))
        ) : (
          <div className="self-center text-center text-xs text-neutral-500">
            No seats in this deck
          </div>
        )}
      </div>

      {/* Rear Section */}
      <RearSection compact={compact} />
    </div>
  );
}

/**
 * Optimized seat grouping algorithm
 * Time Complexity: O(n log n) - sorts once, then single pass
 * Space Complexity: O(n) - creates row groups
 */
function groupSeatsByRow(seats) {
  const sorted = [...seats].sort((a, b) =>
    String(a.seatNumber || "").localeCompare(
      String(b.seatNumber || ""),
      undefined,
      { numeric: true }
    )
  );

  const rowMap = {};
  for (const seat of sorted) {
    const rowNum = String(seat.seatNumber || seat.id).match(/^\D*(\d+)/)?.[1] || "0";
    if (!rowMap[rowNum]) {
      rowMap[rowNum] = [];
    }
    rowMap[rowNum].push(seat);
  }

  return Object.values(rowMap).map((row) =>
    row.sort((a, b) =>
      String(a.seatNumber || "").localeCompare(
        String(b.seatNumber || ""),
        undefined,
        { numeric: true }
      )
    )
  );
}

/**
 * Returns the column after which the aisle is placed in this row.
 * Uses the persisted aisleAfter when available, otherwise falls back
 * to a heuristic (1 for tiny rows, 2 for standard 2+2/2+1 layouts).
 */
function getRowAisleAfter(row) {
  if (row.length <= 1) return 0;
  const raw = row[0]?.aisleAfter;
  if (typeof raw === "number" && raw >= 1) {
    return Math.min(raw, row.length - 1);
  }
  return row.length <= 2 ? 1 : 2;
}

/**
 * SeatRow - Renders a single row split by the aisle.
 * Seats before the aisle sit on the left (window-first), the rest on
 * the right (aisle-first, window at the very edge).
 */
function SeatRow({
  row,
  selectedSeat,
  selectedSeats,
  onSelect,
  multiSelect,
  disabled,
  compact,
}) {
  const leftCount = getRowAisleAfter(row);
  const leftSeats = row.slice(0, leftCount);
  const rightSeats = row.slice(leftCount);

  return (
    <div
      className={`flex items-stretch justify-between ${compact ? "h-[32px] gap-1" : "h-[38px] gap-2"} px-0`}
    >
      {/* Left Side (window seats hug the left wall) */}
      <div className={`flex justify-start ${compact ? "gap-1" : "gap-2"}`}>
        {leftSeats.map((seat) => (
          <SeatButton
            key={seat.id}
            seat={seat}
            selected={
              multiSelect
                ? selectedSeats.some((item) => item.id === seat.id)
                : selectedSeat?.id === seat.id
            }
            multiSelect={multiSelect}
            disabled={disabled}
            onSelect={onSelect}
            compact={compact}
          />
        ))}
      </div>

      {/* Aisle */}
      <span
        className={`self-stretch border-x border-dashed border-[#bcc7b8] ${compact ? "w-4" : "w-7"}`}
        aria-hidden="true"
      />

      {/* Right Side (aisle seat first, window seat at the right wall) */}
      <div className={`flex justify-end ${compact ? "gap-1" : "gap-2"}`}>
        {rightSeats.map((seat) => (
          <SeatButton
            key={seat.id}
            seat={seat}
            selected={
              multiSelect
                ? selectedSeats.some((item) => item.id === seat.id)
                : selectedSeat?.id === seat.id
            }
            multiSelect={multiSelect}
            disabled={disabled}
            onSelect={onSelect}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * SeatButton - Individual seat with styling based on type and status
 */
function SeatButton({ seat, selected, multiSelect, disabled, onSelect, compact }) {
  const isSleeper = seat.seatType === "SLEEPER";
  const unavailable = multiSelect && seat.status !== "AVAILABLE";
  const policy = seat.genderPolicy || "ANY";
  const isFemale = policy === "FEMALE_ONLY" || policy === "FEMALE_PREFERRED";
  const isMale = policy === "MALE_ONLY" || policy === "MALE_PREFERRED";

  // Determine styling based on seat properties
  const getBaseStyle = () => {
    if (unavailable) {
      return "cursor-not-allowed border-neutral-200 bg-neutral-200 text-neutral-400";
    }
    if (isSleeper) {
      return `${compact ? "h-8 rounded-[8px]" : "h-9 rounded-[10px]"} border-[#d1b875] bg-[#e9e0ca] text-[#745e28]`;
    }
    if (isFemale) {
      return "border-[#b49ec4] bg-[#ede8f5] text-[#6b4e8a]";
    }
    if (isMale) {
      return "border-[#7fb1d4] bg-[#ddeef8] text-[#2a6a9a]";
    }
    return "border-[#b7c9ae] bg-[#e4f0df] text-[#4c6746]";
  };

  const policyLabel =
    policy === "FEMALE_ONLY"
      ? "Female only"
      : policy === "FEMALE_PREFERRED"
        ? "Female preferred"
        : policy === "MALE_ONLY"
          ? "Male only"
          : policy === "MALE_PREFERRED"
            ? "Male preferred"
            : "";

  return (
    <button
      type="button"
      className={`grid ${compact ? "h-6 w-8 min-w-[32px] rounded-[6px]" : "h-[30px] w-[38px] min-w-[38px] rounded-[7px]"} place-items-center border p-0 font-mono ${compact ? "text-[9px]" : "text-[11px]"} transition ${getBaseStyle()} ${
        selected
          ? "border-primary-600 bg-primary-600 text-white shadow-[0_0_0_3px_rgba(59,130,246,.16)]"
          : ""
      } hover:brightness-[0.97] active:scale-[0.97]`}
      disabled={disabled || unavailable}
      onClick={() => onSelect(seat)}
      title={[seat.seatNumber || seat.id, seat.seatType, seat.position, policyLabel]
        .filter(Boolean)
        .join(" · ")}
    >
      <strong>{seat.seatNumber || seat.id}</strong>
      <small className={`opacity-70 ${compact ? "text-[7px]" : "text-[8px]"}`}>
        {isFemale ? "♀" : isMale ? "♂" : seat.position?.slice(0, 1)}
      </small>
    </button>
  );
}

/**
 * FrontSection - Bus front with windshield and driver area
 */
function FrontSection({ compact }) {
  return (
    <div
      className={`relative flex flex-none items-end justify-end border-b border-dashed border-[#b8c5b1] ${compact ? "h-[60px] pb-1.5" : "h-[78px] pb-2"}`}
    >
      {/* Windshield */}
      <div
        className={`absolute left-1/2 top-0 -translate-x-1/2 rounded-[42px_42px_10px_10px] border border-[#b8c4b5] bg-[#dce4da] shadow-[inset_0_1px_2px_rgba(255,255,255,.5)] ${compact ? "h-[35px] w-[140px]" : "h-[45px] w-[178px]"}`}
        aria-hidden="true"
      >
        <div
          className={`absolute left-1/2 -translate-x-1/2 bg-[#c1cbc0] ${compact ? "top-[5px] h-[22px] w-px" : "top-[7px] h-[29px] w-px"}`}
        />
      </div>

      {/* Driver Area */}
      <div className={`relative z-10 mr-1 flex flex-col items-center justify-end ${compact ? "h-[45px] w-[45px]" : "h-[58px] w-[58px]"}`}>
        <span
          className={`mb-0.5 font-mono tracking-[.12em] text-[#929d8e] ${compact ? "text-[6px]" : "text-[7px]"}`}
        >
          DRIVER
        </span>
        <div
          className={`relative rounded-full border-[3px] border-[#687464] ${compact ? "h-[22px] w-[22px]" : "h-[28px] w-[28px]"}`}
          aria-hidden="true"
        >
          <span className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#687464] ${compact ? "h-[4px] w-[4px]" : "h-[6px] w-[6px]"}`} />
          <span className={`absolute left-1/2 -translate-x-1/2 bg-[#687464] ${compact ? "top-[2px] h-[8px] w-[2px]" : "top-[3px] h-[10px] w-[2px]"}`} />
          <span className={`absolute rotate-[30deg] bg-[#687464] ${compact ? "bottom-[3px] left-[4px] h-[2px] w-[7px]" : "bottom-[4px] left-[5px] h-[2px] w-[9px]"}`} />
          <span className={`absolute -rotate-[30deg] bg-[#687464] ${compact ? "bottom-[3px] right-[4px] h-[2px] w-[7px]" : "bottom-[4px] right-[5px] h-[2px] w-[9px]"}`} />
        </div>
      </div>

      {/* Front Label & Lights */}
      <span className={`absolute z-20 font-mono tracking-[.12em] text-[#929d8e] ${compact ? "bottom-[5px] left-[4px] text-[7px]" : "bottom-[7px] left-[5px] text-[8px]"}`}>
        FRONT
      </span>
      <span className={`absolute rounded-full border border-[#b7c0b2] bg-[#f0f2e9] ${compact ? "bottom-[6px] left-[9px] h-[4px] w-[10px]" : "bottom-[8px] left-[12px] h-[5px] w-[13px]"}`} aria-hidden="true" />
      <span className={`absolute rounded-full border border-[#b7c0b2] bg-[#f0f2e9] ${compact ? "bottom-[6px] right-[9px] h-[4px] w-[10px]" : "bottom-[8px] right-[12px] h-[5px] w-[13px]"}`} aria-hidden="true" />
    </div>
  );
}

/**
 * RearSection - Bus rear with label and bumper
 */
function RearSection({ compact }) {
  return (
    <div
      className={`relative flex flex-none items-center justify-center border-t border-dashed border-[#b8c5b1] font-mono tracking-[.12em] text-[#929d8e] ${compact ? "h-[24px] text-[7px]" : "h-[30px] text-[8px]"}`}
    >
      REAR
      <span
        className={`absolute left-1/2 -translate-x-1/2 rounded-full border border-[#aeb8a9] bg-[#d5dbd1] ${compact ? "bottom-[-4px] h-[3px] w-[60px]" : "bottom-[-5px] h-[4px] w-[78px]"}`}
        aria-hidden="true"
      />
    </div>
  );
}
