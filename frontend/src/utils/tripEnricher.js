// Helper function to enrich trip data with additional details
export async function enrichTripData(trip, api) {
  try {
    // Fetch bus details
    const bus = await api.getBus(trip.busId);
    
    // Get operator details if bus has operatorId
    let operator = null;
    if (bus.operatorId) {
      operator = await api.getOperator(bus.operatorId);
    }

    // Enrich trip with bus and operator data
    return {
      ...trip,
      busType: bus.busType,
      busModel: bus.model,
      operatorName: operator?.name || "Unknown Operator",
      hasFemaleReservedSeats: bus.hasFemaleReservedSeats || false,
      busDetails: bus,
      operatorDetails: operator,
    };
  } catch (error) {
    console.error("Error enriching trip data:", error);
    return trip;
  }
}

// Batch enrich multiple trips
export async function enrichTripsData(trips, api) {
  try {
    const enrichedTrips = await Promise.all(
      trips.map((trip) => enrichTripData(trip, api))
    );
    return enrichedTrips;
  } catch (error) {
    console.error("Error enriching trips:", error);
    return trips;
  }
}
