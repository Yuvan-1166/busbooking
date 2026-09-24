// Best-effort enrichment of a passenger ticket with journey details
// (trip, schedule, bus and operator) used by the ticket detail view.
export async function enrichTicketData(ticket, api) {
  try {
    // Prefer the authoritative ticket returned for a single booking and merge
    // any journey fields that the list payload may have omitted.
    const authoritative = ticket.bookingId
      ? await api.getTicket(ticket.bookingId).catch(() => null)
      : null;
    const merged = authoritative ? { ...ticket, ...authoritative } : ticket;

    return { ...merged, journey: resolveJourney(merged) };
  } catch (error) {
    return { ...ticket, journey: resolveJourney(ticket) };
  }
}

// Collect journey companions from the various shapes the backend may return:
// either nested objects (trip/schedule/bus/operator) or flat display fields.
function resolveJourney(ticket) {
  const trip =
    ticket.trip && typeof ticket.trip === "object"
      ? ticket.trip
      : ticket.tripId
        ? { id: ticket.tripId }
        : null;

  const schedule =
    ticket.schedule && typeof ticket.schedule === "object"
      ? ticket.schedule
      : ticket.scheduleId
        ? {
            id: ticket.scheduleId,
            routeId: ticket.routeId,
            departureTime: ticket.departureTime,
          }
        : null;

  const bus =
    ticket.bus && typeof ticket.bus === "object"
      ? ticket.bus
      : ticket.busId
        ? {
            id: ticket.busId,
            model: ticket.busModel,
            registrationNumber: ticket.busRegistrationNumber,
            busType: ticket.busType,
          }
        : null;

  const operatorName =
    (ticket.operator &&
      typeof ticket.operator === "object" &&
      ticket.operator.name) ||
    ticket.operatorName ||
    "";

  const routeName =
    (ticket.route && typeof ticket.route === "object" && ticket.route.name) ||
    ticket.routeName ||
    "";

  const pickupLocationName = ticket.pickupLocationName || "";
  const dropLocationName = ticket.dropLocationName || "";

  return { trip, schedule, bus, operatorName, routeName, pickupLocationName, dropLocationName };
}