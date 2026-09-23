export const EARTH_RADIUS_KM = 6371

const toRadians = (degrees) => (degrees * Math.PI) / 180

/**
 * Great-circle distance between two coordinates in kilometres (haversine).
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

/**
 * Distance in km between two location objects (with latitude/longitude).
 * Returns 0 when coordinates are missing.
 */
export function segmentKm(fromLocation, toLocation) {
  if (
    !fromLocation ||
    !toLocation ||
    fromLocation.latitude == null ||
    fromLocation.longitude == null ||
    toLocation.latitude == null ||
    toLocation.longitude == null
  ) {
    return 0
  }
  return haversineKm(
    Number(fromLocation.latitude),
    Number(fromLocation.longitude),
    Number(toLocation.latitude),
    Number(toLocation.longitude)
  )
}

export const round2 = (value) => Math.round(value * 100) / 100

/**
 * Recomputes cumulative "distance from origin" for an ordered list of stops.
 * Each stop: { locationId, distanceFromOriginKm }. The first stop is the
 * origin (0 km); every following stop accumulates the haversine stage.
 * Returns a new stops array (existing fields preserved, distance overwritten).
 */
export function computeCumulativeDistances(stops, locationsById) {
  return stops.map((stop, index) => {
    let distance = 0
    if (index > 0) {
      const prev = locationsById[stops[index - 1].locationId]
      const curr = locationsById[stop.locationId]
      const previousDistance = Number(stops[index - 1].distanceFromOriginKm || 0)
      distance = round2(segmentKm(prev, curr) + previousDistance)
    }
    return { ...stop, distanceFromOriginKm: distance }
  })
}