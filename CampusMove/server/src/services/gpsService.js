/**
 * CampusMove GPS & Telemetry Processing Service
 * Provides mathematical validation, distance calculations (Haversine),
 * and dynamic ETA estimation based on actual telemetry.
 */

const EARTH_RADIUS_METERS = 6371000; // Earth mean radius in meters
const DEFAULT_CAMPUS_BUS_SPEED_KMH = 25; // Default assumed speed when stationary (at stop/light)

/**
 * Validates GPS telemetry payload
 */
export function validateTelemetry({ lat, lng, speed, heading, accuracy }) {
  if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) {
    return { valid: false, error: 'Invalid latitude. Must be between -90 and 90.' };
  }
  if (typeof lng !== 'number' || isNaN(lng) || lng < -180 || lng > 180) {
    return { valid: false, error: 'Invalid longitude. Must be between -180 and 180.' };
  }
  if (accuracy !== undefined && accuracy !== null) {
    if (typeof accuracy !== 'number' || isNaN(accuracy) || accuracy < 0) {
      return { valid: false, error: 'Invalid accuracy. Must be a non-negative number.' };
    }
  }
  if (speed !== undefined && speed !== null) {
    // If speed is provided in km/h or m/s, verify it does not exceed 140 km/h
    const speedKmH = speed > 60 ? speed : speed * 3.6; // heuristically normalize if in m/s
    if (speedKmH > 140) {
      return { valid: false, error: 'Speed anomaly detected (> 140 km/h). Telemetry rejected.' };
    }
  }
  return { valid: true };
}

/**
 * Calculates great-circle distance between two points in meters using Haversine formula
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (angle) => (angle * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c; // In meters
}

/**
 * Calculates ETAs for all remaining stops along the route from current bus GPS coordinates.
 * @param {number} currentLat - Bus latitude
 * @param {number} currentLng - Bus longitude
 * @param {number} currentSpeedKmH - Current bus speed in km/h
 * @param {Array} stops - List of stops on route sorted by sequence_order
 * @param {string|null} currentStopId - Current stop ID reached
 */
export function calculateStopsETA(currentLat, currentLng, currentSpeedKmH, stops, currentStopId = null) {
  if (!stops || stops.length === 0) return [];

  // Effective speed for transit calculations: if bus is paused (0 km/h), use default realistic speed
  const speed = currentSpeedKmH && currentSpeedKmH > 5 ? currentSpeedKmH : DEFAULT_CAMPUS_BUS_SPEED_KMH;
  const speedMetersPerSecond = (speed * 1000) / 3600;

  let cumulativeDistance = 0;
  let previousLat = currentLat;
  let previousLng = currentLng;

  // Find index of current stop if set
  let currentIndex = -1;
  if (currentStopId) {
    currentIndex = stops.findIndex(s => s.id === currentStopId);
  }

  return stops.map((stop, index) => {
    // If stop is behind current stop, mark as PASSED
    if (currentIndex !== -1 && index < currentIndex) {
      return {
        stopId: stop.id,
        stopName: stop.name,
        sequenceOrder: stop.sequence_order,
        scheduledTime: stop.scheduled_time,
        status: 'PASSED',
        distanceMeters: 0,
        etaMinutes: 0,
        etaText: 'Departed'
      };
    }

    // Distance from previous waypoint/stop to this stop
    const legDistance = calculateHaversineDistance(previousLat, previousLng, stop.lat, stop.lng);
    cumulativeDistance += legDistance;

    // Check geofence
    const isAtStop = legDistance <= (stop.geofence_radius_meters || 100);

    // Update previous point for next stop iteration
    previousLat = stop.lat;
    previousLng = stop.lng;

    if (isAtStop && index === currentIndex) {
      return {
        stopId: stop.id,
        stopName: stop.name,
        sequenceOrder: stop.sequence_order,
        scheduledTime: stop.scheduled_time,
        status: 'CURRENT',
        distanceMeters: Math.round(legDistance),
        etaMinutes: 0,
        etaText: 'Arrived / Boarding'
      };
    }

    const etaSeconds = Math.round(cumulativeDistance / speedMetersPerSecond);
    const etaMinutes = Math.max(1, Math.round(etaSeconds / 60));

    return {
      stopId: stop.id,
      stopName: stop.name,
      sequenceOrder: stop.sequence_order,
      scheduledTime: stop.scheduled_time,
      status: index === currentIndex + 1 || (currentIndex === -1 && index === 0) ? 'NEXT' : 'UPCOMING',
      distanceMeters: Math.round(cumulativeDistance),
      etaMinutes,
      etaText: `${etaMinutes} min`
    };
  });
}
