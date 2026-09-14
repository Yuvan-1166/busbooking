export default function BusSeatLayout({
  bus,
  seats,
  selectedSeat,
  selectedSeats = [],
  onSelect,
  multiSelect = false,
  disabled = false,
}) {
  /*
   * Group seats by row number.
   *
   * Example:
   * 1A 1B 1C 1D -> row 1
   * 2A 2B 2C 2D -> row 2
   */
  const rows = Object.values(
    [...seats]
      .sort((left, right) =>
        String(left.seatNumber || "").localeCompare(
          String(right.seatNumber || ""),
          undefined,
          { numeric: true },
        ),
      )
      .reduce((groups, seat) => {
        const row =
          String(seat.seatNumber || seat.id).match(/^\d+/)?.[0] || "0";

        if (!groups[row]) {
          groups[row] = [];
        }

        groups[row].push(seat);
        return groups;
      }, {}),
  ).map((row) =>
    row.sort((left, right) =>
      String(left.seatNumber || "").localeCompare(
        String(right.seatNumber || ""),
        undefined,
        { numeric: true },
      ),
    ),
  );

  return (
    <section
      className="min-w-0 border border-line bg-[#f4f5ef] p-6"
      aria-label={`${bus.registrationNumber} seat layout`}
    >
      {/* =========================================================
          HEADER
      ========================================================= */}

      <div className="flex justify-between gap-[18px]">
        <div>
          <span className="font-mono text-[10px] tracking-[.13em] text-green">
            BUS {bus.id}
          </span>

          <h3 className="mb-1 mt-1 font-display text-[23px] font-semibold text-ink">
            {bus.registrationNumber}
          </h3>

          <p className="m-0 text-[11px] text-muted">
            {bus.model} · {seats.length} seats
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

      {/* =========================================================
          BUS
      ========================================================= */}

      <div className="relative mx-auto my-[18px] w-[250px]">
        {/* =======================================================
            LEFT SIDE MIRROR
        ======================================================= */}

{/* LEFT MIRROR */}
<div
  className="
    absolute
    -left-[11px]
    top-[39px]
    z-20
    h-[22px]
    w-[11px]
    rounded-l-full
    rounded-r-[4px]
    border-2
    border-[#737d70]
    bg-[#d4dbd1]
  "
  aria-hidden="true"
/>

{/* RIGHT MIRROR */}
<div
  className="
    absolute
    -right-[11px]
    top-[39px]
    z-20
    h-[22px]
    w-[11px]
    rounded-r-full
    rounded-l-[4px]
    border-2
    border-[#737d70]
    bg-[#d4dbd1]
  "
  aria-hidden="true"
/>

        {/* =======================================================
            FRONT LEFT WHEEL
        ======================================================= */}

        <BusWheel side="left" position="top-[104px]" />

        {/* =======================================================
            FRONT RIGHT WHEEL
        ======================================================= */}

        <BusWheel side="right" position="top-[104px]" />

        {/* =======================================================
            REAR LEFT WHEEL
        ======================================================= */}

        <BusWheel side="left" position="bottom-[102px]" />

        {/* =======================================================
            REAR RIGHT WHEEL
        ======================================================= */}

        <BusWheel side="right" position="bottom-[102px]" />

        {/* =======================================================
            MAIN BUS BODY
        ======================================================= */}

        <div
          className="
            relative
            z-10
            flex
            h-[620px]
            w-[250px]
            flex-col
            overflow-visible

            rounded-[48px_48px_22px_22px]

            border-2
            border-[#aebaa8]

            bg-[#e7ece3]

            px-3
            pb-5
            pt-3

            shadow-[inset_0_0_0_1px_rgba(255,255,255,.45)]

            max-[700px]:h-[min(540px,58vh)]
            max-[700px]:w-[230px]
          "
        >
          {/* =====================================================
              FRONT / DRIVER SECTION
          ===================================================== */}

          <div
            className="
              relative
              flex
              h-[78px]
              flex-none
              items-end
              justify-end
              border-b
              border-dashed
              border-[#b8c5b1]
              pb-2
            "
          >
            {/* ---------------------------------------------------
                WINDSHIELD
            --------------------------------------------------- */}

            <div
              className="
                absolute
                left-1/2
                top-0
                h-[45px]
                w-[178px]
                -translate-x-1/2

                rounded-[42px_42px_10px_10px]

                border
                border-[#b8c4b5]

                bg-[#dce4da]

                shadow-[inset_0_1px_2px_rgba(255,255,255,.5)]
              "
              aria-hidden="true"
            >
              {/* Windshield divider */}
              <div
                className="
                  absolute
                  left-1/2
                  top-[7px]
                  h-[29px]
                  w-px
                  -translate-x-1/2
                  bg-[#c1cbc0]
                "
              />
            </div>

            {/* ---------------------------------------------------
                DRIVER AREA
            --------------------------------------------------- */}

            <div
              className="
                relative
                z-10
                mr-1
                flex
                h-[58px]
                w-[58px]
                flex-col
                items-center
                justify-end
              "
            >
              <span
                className="
                  mb-0.5
                  font-mono
                  text-[7px]
                  tracking-[.12em]
                  text-[#929d8e]
                "
              >
                DRIVER
              </span>

              {/* Steering wheel */}
              <div
                className="
                  relative
                  h-[28px]
                  w-[28px]
                  rounded-full
                  border-[3px]
                  border-[#687464]
                "
                aria-hidden="true"
              >
                {/* Hub */}
                <span
                  className="
                    absolute
                    left-1/2
                    top-1/2
                    h-[6px]
                    w-[6px]
                    -translate-x-1/2
                    -translate-y-1/2
                    rounded-full
                    bg-[#687464]
                  "
                />

                {/* Top spoke */}
                <span
                  className="
                    absolute
                    left-1/2
                    top-[3px]
                    h-[10px]
                    w-[2px]
                    -translate-x-1/2
                    bg-[#687464]
                  "
                />

                {/* Bottom-left spoke */}
                <span
                  className="
                    absolute
                    bottom-[4px]
                    left-[5px]
                    h-[2px]
                    w-[9px]
                    rotate-[30deg]
                    bg-[#687464]
                  "
                />

                {/* Bottom-right spoke */}
                <span
                  className="
                    absolute
                    bottom-[4px]
                    right-[5px]
                    h-[2px]
                    w-[9px]
                    -rotate-[30deg]
                    bg-[#687464]
                  "
                />
              </div>
            </div>

            {/* FRONT label */}
            <span
              className="
              absolute
              bottom-[7px]
              left-[5px]
              z-20
              font-mono
              text-[8px]
              tracking-[.12em]
              text-[#929d8e]
            "
            >
              FRONT
            </span>

            {/* Small front lights */}
            <span
              className="
                absolute
                bottom-[8px]
                left-[12px]
                h-[5px]
                w-[13px]
                rounded-full
                border
                border-[#b7c0b2]
                bg-[#f0f2e9]
              "
              aria-hidden="true"
            />

            <span
              className="
                absolute
                bottom-[8px]
                right-[12px]
                h-[5px]
                w-[13px]
                rounded-full
                border
                border-[#b7c0b2]
                bg-[#f0f2e9]
              "
              aria-hidden="true"
            />
          </div>

          {/* =====================================================
              SEAT AREA
          ===================================================== */}

          <div
            className="
              grid
              min-h-0
              flex-1
              grid-cols-1
              gap-0
              overflow-hidden
            "
            style={{
              gridTemplateRows: `repeat(${rows.length || 1}, 38px)`,
              alignContent: "space-between",
            }}
          >
            {rows.length ? (
              rows.map((row) => {
                /*
                 * Standard 2 + 2 bus arrangement:
                 *
                 * 1A 1B | 1C 1D
                 * 2A 2B | 2C 2D
                 *
                 * If a row has fewer than four seats,
                 * preserve the existing behavior.
                 */

                const leftSeats =
                  row.length <= 2 ? row.slice(0, 1) : row.slice(0, 2);

                const rightSeats =
                  row.length <= 2 ? row.slice(1) : row.slice(2);

                return (
                  <div
                    className="
                      grid
                      h-[38px]
                      grid-cols-[88px_28px_88px]
                      justify-center
                      gap-0

                      max-[700px]:grid-cols-[76px_18px_76px]
                    "
                    key={row[0]?.seatNumber || row[0]?.id}
                  >
                    {/* =================================================
                        LEFT SIDE
                    ================================================= */}

                    <div
                      className="
                        grid
                        w-[88px]
                        grid-cols-2
                        justify-center
                        gap-2

                        max-[700px]:w-[76px]
                        max-[700px]:gap-1.5
                      "
                    >
                      {leftSeats.map((seat) => (
                        <SeatButton
                          key={seat.id}
                          seat={seat}
                          selected={multiSelect ? selectedSeats.some((item) => item.id === seat.id) : selectedSeat?.id === seat.id}
                          multiSelect={multiSelect}
                          disabled={disabled}
                          onSelect={onSelect}
                        />
                      ))}
                    </div>

                    {/* =================================================
                        AISLE
                    ================================================= */}

                    <span
                      className="
                        min-h-7
                        w-7
                        border-x
                        border-dashed
                        border-[#bcc7b8]

                        max-[700px]:w-[18px]
                      "
                      aria-hidden="true"
                    />

                    {/* =================================================
                        RIGHT SIDE
                    ================================================= */}

                    <div
                      className="
                        grid
                        w-[88px]
                        grid-cols-2
                        justify-center
                        gap-2

                        max-[700px]:w-[76px]
                        max-[700px]:gap-1.5
                      "
                    >
                      {rightSeats.map((seat) => (
                        <SeatButton
                          key={seat.id}
                          seat={seat}
                          selected={multiSelect ? selectedSeats.some((item) => item.id === seat.id) : selectedSeat?.id === seat.id}
                          multiSelect={multiSelect}
                          disabled={disabled}
                          onSelect={onSelect}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="self-center text-center text-xs text-muted">
                Add seats to see the bus layout.
              </div>
            )}
          </div>

          {/* =====================================================
              REAR
          ===================================================== */}

          <div
            className="
            relative
            flex
            h-[30px]
            flex-none
            items-center
            justify-center

            border-t
            border-dashed
            border-[#b8c5b1]

            font-mono
            text-[8px]
            tracking-[.12em]
            text-[#929d8e]
          "
          >
            REAR
            {/* Rear bumper */}
            <span
              className="
              absolute
              bottom-[-5px]
              left-1/2
              h-[4px]
              w-[78px]
              -translate-x-1/2
              rounded-full
              border
              border-[#aeb8a9]
              bg-[#d5dbd1]
            "
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* =========================================================
          SEAT STATISTICS
      ========================================================= */}

      <div
        className="
          flex
          flex-wrap
          gap-4
          font-mono
          text-[10px]
          uppercase
          text-muted
        "
      >
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

        {seats.some((seat) => seat.genderPolicy === "FEMALE_ONLY" || seat.genderPolicy === "FEMALE_PREFERRED") && (
          <span>
            <strong className="mr-1 text-base text-[#6b4e8a]">
              {seats.filter((seat) => seat.genderPolicy === "FEMALE_ONLY" || seat.genderPolicy === "FEMALE_PREFERRED").length}
            </strong>
            Female
          </span>
        )}

        {seats.some((seat) => seat.genderPolicy === "MALE_ONLY" || seat.genderPolicy === "MALE_PREFERRED") && (
          <span>
            <strong className="mr-1 text-base text-[#2a6a9a]">
              {seats.filter((seat) => seat.genderPolicy === "MALE_ONLY" || seat.genderPolicy === "MALE_PREFERRED").length}
            </strong>
            Male
          </span>
        )}
      </div>
    </section>
  );
}

/* ===============================================================
   BUS WHEEL
================================================================ */

function BusWheel({ side, position }) {
  const isLeft = side === "left";

  return (
    <div
      className={`
        absolute
        ${isLeft ? "-left-[7px]" : "-right-[7px]"}
        ${position}
        z-0

        h-[58px]
        w-[15px]

        ${
          isLeft
            ? "rounded-l-[12px] border-l-2 border-y-2"
            : "rounded-r-[12px] border-r-2 border-y-2"
        }

        border-[#737d70]
        bg-[#c1c8be]
      `}
      aria-hidden="true"
    >
      {/* Small visible tyre */}
      <span
        className={`
          absolute
          top-1/2
          h-[34px]
          w-[5px]
          -translate-y-1/2
          rounded-full
          bg-[#8f988b]

          ${isLeft ? "right-[1px]" : "left-[1px]"}
        `}
      />
    </div>
  );
}

/* ===============================================================
   SEAT BUTTON
================================================================ */

function SeatButton({ seat, selected, multiSelect, disabled, onSelect }) {
  const isSleeper = seat.seatType === "SLEEPER";
  const unavailable = multiSelect && seat.status !== "AVAILABLE";
  const policy = seat.genderPolicy || "ANY";
  const isFemale = policy === "FEMALE_ONLY" || policy === "FEMALE_PREFERRED";
  const isMale = policy === "MALE_ONLY" || policy === "MALE_PREFERRED";

  // Determine base style when seat is available and not selected
  function getBaseStyle() {
    if (unavailable) {
      return "cursor-not-allowed border-[#e0ded5] bg-[#e5e3dc] text-[#abaea7]";
    }
    if (isSleeper) {
      return "h-9 rounded-[10px] border-[#d1b875] bg-[#e9e0ca] text-[#745e28]";
    }
    if (isFemale) {
      return "border-[#b49ec4] bg-[#ede8f5] text-[#6b4e8a]";
    }
    if (isMale) {
      return "border-[#7fb1d4] bg-[#ddeef8] text-[#2a6a9a]";
    }
    return "border-[#b7c9ae] bg-[#e4f0df] text-[#4c6746]";
  }

  // Policy label for title tooltip
  const policyLabel =
    policy === "FEMALE_ONLY" ? "Female only" :
    policy === "FEMALE_PREFERRED" ? "Female preferred" :
    policy === "MALE_ONLY" ? "Male only" :
    policy === "MALE_PREFERRED" ? "Male preferred" : "";

  return (
    <button
      type="button"
      className={`
        grid
        h-[30px]
        w-[38px]
        min-w-[38px]
        place-items-center

        rounded-[7px]

        border
        p-0

        font-mono
        text-[11px]

        transition

        max-[700px]:
          h-7
          w-[34px]
          min-w-[34px]

        ${getBaseStyle()}

        ${
          selected
            ? `
              border-orange
              bg-orange
              text-white
              shadow-[0_0_0_3px_rgba(233,101,69,.16)]
            `
            : ""
        }

        hover:brightness-[0.97]
        active:scale-[0.97]
      `}
      disabled={disabled || unavailable}
      onClick={() => onSelect(seat)}
      title={[
        `${seat.seatNumber || seat.id}`,
        seat.seatType,
        seat.position,
        policyLabel,
      ].filter(Boolean).join(" · ")}
    >
      <strong>{seat.seatNumber || seat.id}</strong>

      <small className="text-[8px] opacity-70">
        {isFemale ? "♀" : isMale ? "♂" : seat.position?.slice(0, 1)}
      </small>
    </button>
  );
}
