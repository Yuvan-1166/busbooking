import { useEffect, useState } from "react";
import BusSeatLayout from "../workspace/BusSeatLayout";
import { api } from "../../api";

/** Returns the gender locked by a strict policy, or null if open. */
function lockedGender(policy) {
  if (policy === "FEMALE_ONLY") return "FEMALE";
  if (policy === "MALE_ONLY") return "MALE";
  return null;
}

/** Human-readable label for a policy. */
function policyLabel(policy) {
  switch (policy) {
    case "FEMALE_ONLY": return "Female only";
    case "FEMALE_PREFERRED": return "Female preferred";
    case "MALE_ONLY": return "Male only";
    case "MALE_PREFERRED": return "Male preferred";
    default: return null;
  }
}

/** Tailwind classes for the gender-policy badge on a fieldset. */
function policyBadgeClass(policy) {
  if (policy === "FEMALE_ONLY" || policy === "FEMALE_PREFERRED")
    return "bg-[#ede8f5] text-[#6b4e8a] border-[#b49ec4]";
  if (policy === "MALE_ONLY" || policy === "MALE_PREFERRED")
    return "bg-[#ddeef8] text-[#2a6a9a] border-[#7fb1d4]";
  return null;
}

export default function BookingPanel({
  trip,
  seats,
  selectedSeats,
  toggleSeat,
  onConfirm,
  bookingInProgress,
  onBack,
}) {
  const [passengerDetails, setPassengerDetails] = useState({});
  const [busDetails, setBusDetails] = useState(null);
  const selectedSeatKey = selectedSeats.map((seat) => seat.id).join(",");

  // Load bus details to get deckType
  useEffect(() => {
    async function loadBusDetails() {
      if (trip.busId) {
        try {
          const bus = await api.getBus(trip.busId);
          setBusDetails(bus);
        } catch (err) {
          console.error("Failed to load bus details:", err);
          // Fallback to basic info
          setBusDetails({
            id: trip.busId,
            registrationNumber: `Bus ${trip.busId}`,
            model: trip.busModel || "Bus",
            deckType: "SINGLE", // fallback
          });
        }
      }
    }
    loadBusDetails();
  }, [trip.busId, trip.busModel]);

  useEffect(() => {
    setPassengerDetails((current) =>
      Object.fromEntries(
        selectedSeats.map((seat) => {
          const existing = current[String(seat.id)];
          const forced = lockedGender(seat.genderPolicy);
          return [
            String(seat.id),
            {
              firstName: existing?.firstName || "",
              lastName: existing?.lastName || "",
              age: existing?.age || "",
              // If the seat has a strict policy, force the gender; otherwise keep existing.
              gender: forced || existing?.gender || "",
            },
          ];
        }),
      ),
    );
  }, [selectedSeatKey]);

  const updatePassenger = (seatId, field, value) =>
    setPassengerDetails((current) => ({
      ...current,
      [String(seatId)]: {
        ...current[String(seatId)],
        [field]: value,
      },
    }));

  const submitBooking = (event) => {
    event.preventDefault();

    // Validate gender policy compliance before submitting
    for (const seat of selectedSeats) {
      const forced = lockedGender(seat.genderPolicy);
      if (!forced) continue;
      const chosen = passengerDetails[String(seat.id)]?.gender;
      if (chosen !== forced) {
        const label = seat.genderPolicy === "FEMALE_ONLY" ? "female" : "male";
        window.alert(
          `Seat ${seat.seatNumber || seat.id} is reserved for ${label} passengers. Please correct the gender before confirming.`,
        );
        return;
      }
    }

    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      return;
    }
    onConfirm({
      passengers: selectedSeats.map((seat) => ({
        tripSeatId: Number(seat.id),
        firstName: passengerDetails[String(seat.id)].firstName.trim(),
        lastName: passengerDetails[String(seat.id)].lastName.trim(),
        age: Number(passengerDetails[String(seat.id)].age),
        gender: passengerDetails[String(seat.id)].gender,
      })),
    });
  };

  return (
    <main className="mx-auto mb-[100px] mt-[55px] max-w-[1168px] max-[600px]:mx-4 max-[600px]:mt-9">
      <button
        className="border-0 bg-transparent p-0 text-xs text-muted"
        onClick={onBack}
      >
        ← Back to Search
      </button>
      <div className="mb-10 mt-[43px] flex items-end justify-between max-[900px]:flex-col max-[900px]:items-start max-[900px]:gap-6">
        <div>
          <p className="mb-3.5 font-mono text-[10px] tracking-[.13em] text-green">
            TRIP #{trip.id}
          </p>
          <h1 className="mb-3.5 font-display text-5xl font-semibold leading-[.95] tracking-[-.045em] text-ink max-[600px]:text-[40px]">
            Select seats.
          </h1>
        </div>
        <div className="text-right max-[900px]:text-left">
          <strong className="block font-mono text-xl font-semibold">
            Route {trip.routeId}
          </strong>
          <small className="mt-2 block font-mono text-[10px] text-muted">
            {trip.tripDate} · {trip.departureTime || "Time not provided"} · Bus{" "}
            {trip.busId || "—"}
          </small>
          <p className="mt-3 font-mono text-[11px] text-green">
            Fare per seat <strong className="text-base text-ink">{formatCurrency(trip.startingFare)}</strong>
          </p>
        </div>
      </div>
      <div className="grid grid-cols-[1.4fr_.75fr] gap-[27px] max-[900px]:grid-cols-1">
        {busDetails ? (
          <BusSeatLayout
            bus={busDetails}
            seats={seats}
            selectedSeats={selectedSeats}
            multiSelect
            disabled={bookingInProgress}
            onSelect={toggleSeat}
          />
        ) : (
          <div className="flex items-center justify-center border border-line bg-[#f4f5ef] p-12">
            <p className="text-muted">Loading bus layout...</p>
          </div>
        )}
        <form
          className="self-start border border-[#e7e5dc] bg-paper p-[26px]"
          noValidate
          onSubmit={submitBooking}
        >
          <div className="flex justify-between gap-[18px]">
            <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-ink font-mono text-[11px] text-white">
              2
            </span>
            <div className="flex-1">
              <h2 className="mb-1.5 font-display text-[22px] font-semibold text-ink">
                Booking details
              </h2>
              <p className="text-[11px] text-muted">
                Review your selected seats.
              </p>
            </div>
          </div>
          {selectedSeats.length ? (
            <div className="mt-5 grid gap-2">
              {selectedSeats.map((seat) => {
                const policy = seat.genderPolicy || "ANY";
                const forced = lockedGender(policy);
                const badge = policyLabel(policy);
                const badgeClass = policyBadgeClass(policy);

                return (
                  <fieldset
                    className={`grid gap-2 border p-3 ${badgeClass ? `${badgeClass} border` : "border-line"}`}
                    key={seat.id}
                  >
                    <legend className="px-1 font-mono text-[10px] uppercase text-green">
                      Seat {seat.seatNumber || seat.id}
                      {badge && (
                        <span className={`ml-2 rounded px-1.5 py-0.5 text-[9px] border ${badgeClass}`}>
                          {badge}
                        </span>
                      )}
                    </legend>
                    <div className="grid grid-cols-2 gap-2 max-[600px]:grid-cols-1">
                      <label className="grid gap-1 font-mono text-[9px] uppercase text-muted">
                        First name
                        <input
                          className="w-full border-0 border-b border-line bg-transparent py-2 text-xs text-ink outline-0"
                          value={passengerDetails[String(seat.id)]?.firstName || ""}
                          onChange={(event) => updatePassenger(seat.id, "firstName", event.target.value)}
                          required
                        />
                      </label>
                      <label className="grid gap-1 font-mono text-[9px] uppercase text-muted">
                        Last name
                        <input
                          className="w-full border-0 border-b border-line bg-transparent py-2 text-xs text-ink outline-0"
                          value={passengerDetails[String(seat.id)]?.lastName || ""}
                          onChange={(event) => updatePassenger(seat.id, "lastName", event.target.value)}
                          required
                        />
                      </label>
                      <label className="grid gap-1 font-mono text-[9px] uppercase text-muted">
                        Age
                        <input
                          className="w-full border-0 border-b border-line bg-transparent py-2 text-xs text-ink outline-0"
                          type="number"
                          min="1"
                          max="120"
                          value={passengerDetails[String(seat.id)]?.age || ""}
                          onChange={(event) => updatePassenger(seat.id, "age", event.target.value)}
                          required
                        />
                      </label>
                      <label className="grid gap-1 font-mono text-[9px] uppercase text-muted">
                        Gender
                        {forced ? (
                          /* Locked: show a read-only indicator for gender-reserved seats */
                          <div className={`flex items-center gap-1.5 border-b py-2 text-xs font-semibold ${forced === "FEMALE" ? "border-[#b49ec4] text-[#6b4e8a]" : "border-[#7fb1d4] text-[#2a6a9a]"}`}>
                            {forced === "FEMALE" ? "♀ Female" : "♂ Male"}
                            <input type="hidden" value={forced} />
                          </div>
                        ) : (
                          <select
                            className="w-full border-0 border-b border-line bg-transparent py-2 text-xs text-ink outline-0"
                            value={passengerDetails[String(seat.id)]?.gender || ""}
                            onChange={(event) => updatePassenger(seat.id, "gender", event.target.value)}
                            required
                          >
                            <option value="" disabled>Select gender</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                          </select>
                        )}
                      </label>
                    </div>
                  </fieldset>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-center text-[10px] text-orange">Select seats to continue.</p>
          )}
          <div className="my-[27px] flex justify-between border-t border-line pt-[17px] font-mono text-[11px]">
            <span>
              {selectedSeats.length} seat{selectedSeats.length === 1 ? "" : "s"}{" "}
              selected
            </span>
            <strong className="text-right text-base">
              {selectedSeats.length ? formatCurrency(Number(trip.startingFare) * selectedSeats.length) : "—"}
              {selectedSeats.length > 0 && <small className="block text-[8px] font-normal text-muted">total fare</small>}
            </strong>
          </div>
          <button
            className="w-full border-0 bg-orange px-[17px] py-3.5 text-left font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
            disabled={bookingInProgress || !selectedSeats.length}
          >
            {bookingInProgress ? "Please wait…" : "Proceed to payment"}{" "}
            <span className="float-right text-lg">→</span>
          </button>
        </form>
      </div>
    </main>
  );
}

function formatCurrency(amount) {
  return amount == null ? "—" : `₹${Number(amount).toLocaleString("en-IN")}`;
}
