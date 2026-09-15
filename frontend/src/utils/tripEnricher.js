import { parseApiError, getErrorMessage } from "./errorHandler";

// Helper function to enrich trip data with additional details
export async function enrichTripData(trip, api) {
  try {
    // Fetch bus details
    const bus = await api.getBus(trip.busId);
    
    // Get operator details if bus has operatorId
    let operator = null;
    if (bus.operatorId) {
      try {
        operator = await api.getOperator(bus.operatorId);
      } catch (opError) {
        console.warn("Failed to fetch operator details:", opError);
        // Continue without operator details
      }
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
      enrichmentError: null,
    };
  } catch (error) {
    const appError = parseApiError(error);
    console.error("Error enriching trip data:", appError);
    
    // Return trip with enrichment error flag but don't break the flow
    return {
      ...trip,
      enrichmentError: getErrorMessage(appError),
      busType: trip.busType || "Unknown",
      busModel: "Unknown",
      operatorName: "Unknown Operator",
      hasFemaleReservedSeats: false,
    };
  }
}

// Batch enrich multiple trips with error handling
export async function enrichTripsData(trips, api) {
  try {
    const enrichedTrips = await Promise.all(
      trips.map((trip) => enrichTripData(trip, api).catch((error) => {
        console.error(`Failed to enrich trip ${trip.id}:`, error);
        // Return original trip with error flag on failure
        return {
          ...trip,
          enrichmentError: "Failed to load details",
          busType: trip.busType || "Unknown",
          busModel: "Unknown",
          operatorName: "Unknown Operator",
          hasFemaleReservedSeats: false,
        };
      }))
    );
    return enrichedTrips;
  } catch (error) {
    console.error("Error enriching trips batch:", error);
    // Return original trips if batch operation fails
    return trips.map((trip) => ({
      ...trip,
      enrichmentError: "Failed to load details",
      busType: trip.busType || "Unknown",
      busModel: "Unknown",
      operatorName: "Unknown Operator",
      hasFemaleReservedSeats: false,
    }));
  }
}
