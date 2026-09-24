import { useEffect, useState } from "react";
import BusSeatLayout from "../workspace/BusSeatLayout";
import { api } from "../../api";
import { seatNumber, tripLabel } from "../../utils/reference";

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
            registrationNumber: "Bus",
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
          `Seat ${seatNumber(seat)} is reserved for ${label} passengers. Please correct the gender before confirming.`,
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
    <main className="mx-auto mb-20 mt-8 min-h-screen max-w-6xl px-4 sm:px-6">
      {/* Back button */}
      <button
        className="btn-ghost mb-6"
        onClick={onBack}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Results
      </button>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="badge badge-info">
              {trip.routeName || tripLabel(trip)}
            </span>
            {trip.tripDate && (
              <span className="badge badge-neutral">
                {trip.tripDate}
                {trip.departureTime ? ` · ${trip.departureTime}` : ""}
              </span>
            )}
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-neutral-900 sm:text-3xl">
            Select Your Seats
          </h1>
          <p className="text-sm text-neutral-600">
            Choose your preferred seats from the bus layout below
          </p>
        </div>
        <div className="card bg-primary-50 text-right max-[900px]:w-full max-[900px]:text-left">
          <div className="mb-2 text-xs font-medium text-primary-700">
            {trip.tripDate} · {trip.departureTime || "—"}
          </div>
          <div className="text-2xl font-bold text-primary-600">
            {formatCurrency(trip.startingFare)}
          </div>
          <div className="text-xs text-primary-700">per seat</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        {/* Seat Layout */}
        <div className="card">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="mb-1 text-lg font-semibold text-neutral-900">Bus Layout</h2>
              <p className="text-sm text-neutral-600">
                {busDetails?.registrationNumber || "Loading..."}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-neutral-600">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-neutral-300 bg-white"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-primary-500 bg-primary-500"></div>
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-neutral-300 bg-neutral-200"></div>
                <span>Booked</span>
              </div>
            </div>
          </div>

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
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="spinner mx-auto mb-4"></div>
                <p className="text-neutral-600">Loading bus layout...</p>
              </div>
            </div>
          )}
        </div>

        {/* Passenger Details Form */}
        <div className="card self-start">
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-white">
                2
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  Passenger Details
                </h2>
                <p className="text-sm text-neutral-600">
                  Enter details for each seat
                </p>
              </div>
            </div>
          </div>

          <form noValidate onSubmit={submitBooking}>
            {selectedSeats.length ? (
              <div className="space-y-4">
                {selectedSeats.map((seat) => {
                  const policy = seat.genderPolicy || "ANY";
                  const forced = lockedGender(policy);
                  const badge = policyLabel(policy);
                  const badgeClass = policyBadgeClass(policy);

                  return (
                    <fieldset
                      className={`rounded-lg border-2 p-4 ${
                        badgeClass 
                          ? badgeClass 
                          : "border-neutral-200 bg-neutral-50"
                      }`}
                      key={seat.id}
                    >
                      <legend className="px-2 text-sm font-semibold text-neutral-900">
                        Seat {seatNumber(seat)}
                        {badge && (
                          <span className={`ml-2 rounded px-2 py-1 text-xs ${badgeClass}`}>
                            {badge}
                          </span>
                        )}
                      </legend>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="form-group mb-0">
                          <label className="form-label text-xs">First name *</label>
                          <input
                            className="input"
                            value={passengerDetails[String(seat.id)]?.firstName || ""}
                            onChange={(event) => updatePassenger(seat.id, "firstName", event.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group mb-0">
                          <label className="form-label text-xs">Last name *</label>
                          <input
                            className="input"
                            value={passengerDetails[String(seat.id)]?.lastName || ""}
                            onChange={(event) => updatePassenger(seat.id, "lastName", event.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group mb-0">
                          <label className="form-label text-xs">Age *</label>
                          <input
                            className="input"
                            type="number"
                            min="1"
                            max="120"
                            value={passengerDetails[String(seat.id)]?.age || ""}
                            onChange={(event) => updatePassenger(seat.id, "age", event.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group mb-0">
                          <label className="form-label text-xs">Gender *</label>
                          {forced ? (
                            <div className={`flex items-center gap-2 rounded-md border-2 px-3 py-2 text-sm font-semibold ${forced === "FEMALE" ? "border-[#b49ec4] bg-[#ede8f5] text-[#6b4e8a]" : "border-[#7fb1d4] bg-[#ddeef8] text-[#2a6a9a]"}`}>
                              {forced === "FEMALE" ? "♀ Female" : "♂ Male"}
                              <input type="hidden" value={forced} />
                            </div>
                          ) : (
                            <select
                              className="select"
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
                        </div>
                      </div>
                    </fieldset>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200">
                  <svg className="h-6 w-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <p className="text-sm text-neutral-600">Select seats from the bus layout above</p>
              </div>
            )}

            {/* Summary & Submit */}
            <div className="divider"></div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-600">
                  {selectedSeats.length} seat{selectedSeats.length === 1 ? "" : "s"} selected
                </div>
                <div className="mt-1 text-2xl font-bold text-neutral-900">
                  {selectedSeats.length ? formatCurrency(Number(trip.startingFare) * selectedSeats.length) : "₹0"}
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-lg transition-smooth hover-scale disabled:opacity-50"
                disabled={bookingInProgress || !selectedSeats.length}
              >
                {bookingInProgress ? (
                  <span className="flex items-center gap-2 fade-in">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-l-transparent"></div>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 transition-colors">
                    Continue to Payment
                    <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function formatCurrency(amount) {
  return amount == null ? "—" : `₹${Number(amount).toLocaleString("en-IN")}`;
}
