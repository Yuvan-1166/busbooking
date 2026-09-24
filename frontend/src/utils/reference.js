export function tripLabel(trip = {}) {
  const parts = [
    trip.routeName || trip.route?.name || null,
    trip.tripDate || null,
    trip.departureTime || null,
  ].filter(Boolean);
  return parts.join(" • ") || "Trip";
}

export function busLabel(bus = {}) {
  return bus.registrationNumber || bus.model || "Bus";
}

export function seatNumber(seat = {}) {
  return seat.seatNumber || "—";
}

export function passengerName(passenger = {}) {
  const full = [passenger.firstName, passenger.lastName]
    .filter(Boolean)
    .join(" ");
  return full || passenger.name || passenger.fullName || "Passenger";
}

export function locationLabel(location = {}) {
  if (!location?.name) return "Unknown location";
  return [location.name, location.city].filter(Boolean).join(", ");
}