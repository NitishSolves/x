import crypto from 'node:crypto';
import db from '../config/db.js';
import { validateTelemetry, calculateStopsETA } from '../services/gpsService.js';

let ioInstance = null;
export function setSocketIO(io) {
  ioInstance = io;
}

export async function startTrip(req, res) {
  try {
    const collegeId = req.user.collegeId;
    const driverId = req.user.id;
    const { routeId, busId, direction = 'OUTBOUND' } = req.body;

    if (!routeId || !busId) {
      return res.status(400).json({ error: 'Route ID and Bus ID are required to start a trip.' });
    }

    // Verify route and bus belong to college
    const routeResult = await db.query('SELECT * FROM routes WHERE id = $1 AND college_id = $2', [routeId, collegeId]);
    if (routeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found.' });
    }

    const busResult = await db.query('SELECT * FROM buses WHERE id = $1 AND college_id = $2', [busId, collegeId]);
    if (busResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bus not found.' });
    }

    // Check if bus is already in an active trip
    const activeBusTrip = await db.query(
      `SELECT id FROM trips WHERE bus_id = $1 AND status = 'IN_PROGRESS'`,
      [busId]
    );
    if (activeBusTrip.rows.length > 0) {
      return res.status(409).json({
        error: 'This bus is already in service on an active trip. Please end that trip first.',
        existingTripId: activeBusTrip.rows[0].id
      });
    }

    // Check if driver has an existing active trip
    const activeDriverTrip = await db.query(
      `SELECT id FROM trips WHERE driver_id = $1 AND status = 'IN_PROGRESS'`,
      [driverId]
    );
    if (activeDriverTrip.rows.length > 0) {
      // Gracefully complete the stale trip
      await db.query(
        `UPDATE trips SET status = 'COMPLETED', end_time = CURRENT_TIMESTAMP WHERE id = $1`,
        [activeDriverTrip.rows[0].id]
      );
    }

    // Get the first stop of the route for initial coordinates if available
    const firstStopResult = await db.query(
      `SELECT * FROM stops WHERE route_id = $1 ORDER BY sequence_order ASC LIMIT 1`,
      [routeId]
    );
    const initialLat = firstStopResult.rows.length > 0 ? firstStopResult.rows[0].lat : routeResult.rows[0].center_lat;
    const initialLng = firstStopResult.rows.length > 0 ? firstStopResult.rows[0].lng : routeResult.rows[0].center_lng;
    const initialStopId = firstStopResult.rows.length > 0 ? firstStopResult.rows[0].id : null;

    const tripId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.query(
      `INSERT INTO trips (
        id, college_id, route_id, bus_id, driver_id, status, direction,
        start_time, current_lat, current_lng, current_speed, current_heading,
        current_accuracy, current_stop_id, passenger_count, occupancy_status, last_telemetry_at
       ) VALUES ($1, $2, $3, $4, $5, 'IN_PROGRESS', $6, $7, $8, $9, 0, 0, 5, $10, 0, 'SEATS_AVAILABLE', $11)`,
      [tripId, collegeId, routeId, busId, driverId, direction, now, initialLat, initialLng, initialStopId, now]
    );

    const fullTrip = await fetchTripDetails(tripId, collegeId);

    // Broadcast trip started to college room
    if (ioInstance) {
      ioInstance.to(`college:${collegeId}`).emit('trip:started', fullTrip);
    }

    res.status(201).json(fullTrip);
  } catch (err) {
    console.error('[Start Trip Error]:', err);
    res.status(500).json({ error: 'Failed to start trip.' });
  }
}

export async function endTrip(req, res) {
  try {
    const collegeId = req.user.collegeId;
    const { id } = req.params;

    const tripResult = await db.query(
      `SELECT * FROM trips WHERE id = $1 AND college_id = $2`,
      [id, collegeId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    const trip = tripResult.rows[0];
    if (trip.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Trip is not currently active.' });
    }

    const now = new Date().toISOString();
    await db.query(
      `UPDATE trips SET status = 'COMPLETED', end_time = $1 WHERE id = $2`,
      [now, id]
    );

    // Broadcast trip ended
    if (ioInstance) {
      ioInstance.to(`college:${collegeId}`).emit('trip:ended', { tripId: id, collegeId });
      ioInstance.to(`trip:${id}`).emit('trip:ended', { tripId: id });
    }

    res.json({ message: 'Trip completed successfully.', tripId: id, endTime: now });
  } catch (err) {
    console.error('[End Trip Error]:', err);
    res.status(500).json({ error: 'Failed to end trip.' });
  }
}

export async function getActiveTrips(req, res) {
  try {
    const collegeId = req.user.collegeId;

    const tripsResult = await db.query(
      `SELECT t.*,
              b.bus_number, b.license_plate, b.capacity as bus_capacity, b.model as bus_model,
              r.name as route_name, r.code as route_code, r.color as route_color,
              r.origin as route_origin, r.destination as route_destination, r.path_coordinates,
              u.name as driver_name, u.phone as driver_phone
       FROM trips t
       JOIN buses b ON t.bus_id = b.id
       JOIN routes r ON t.route_id = r.id
       JOIN users u ON t.driver_id = u.id
       WHERE t.college_id = $1 AND t.status = 'IN_PROGRESS'
       ORDER BY t.start_time DESC`,
      [collegeId]
    );

    // Process each trip and compute real dynamic ETAs for its stops
    const activeTrips = [];
    for (const trip of tripsResult.rows) {
      let pathCoords = [];
      try {
        pathCoords = typeof trip.path_coordinates === 'string' ? JSON.parse(trip.path_coordinates) : (trip.path_coordinates || []);
      } catch (e) {
        pathCoords = [];
      }

      // Fetch stops for this route
      const stopsResult = await db.query(
        `SELECT * FROM stops WHERE route_id = $1 ORDER BY sequence_order ASC`,
        [trip.route_id]
      );

      const stopsWithEta = calculateStopsETA(
        trip.current_lat,
        trip.current_lng,
        trip.current_speed,
        stopsResult.rows,
        trip.current_stop_id
      );

      activeTrips.push({
        ...trip,
        path_coordinates: pathCoords,
        stops: stopsWithEta
      });
    }

    res.json(activeTrips);
  } catch (err) {
    console.error('[Get Active Trips Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve active trips.' });
  }
}

export async function getTripById(req, res) {
  try {
    const collegeId = req.user.collegeId;
    const { id } = req.params;

    const trip = await fetchTripDetails(id, collegeId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    // Also get last 50 telemetry points
    const telemetryResult = await db.query(
      `SELECT lat, lng, speed, heading, accuracy, recorded_at
       FROM gps_telemetry
       WHERE trip_id = $1
       ORDER BY recorded_at DESC
       LIMIT 50`,
      [id]
    );

    res.json({
      ...trip,
      telemetryHistory: telemetryResult.rows.reverse()
    });
  } catch (err) {
    console.error('[Get Trip By ID Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve trip details.' });
  }
}

export async function postTelemetry(req, res) {
  try {
    const { tripId, lat, lng, speed = 0, heading = 0, accuracy = 5 } = req.body;

    const validation = validateTelemetry({ lat, lng, speed, heading, accuracy });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const tripResult = await db.query('SELECT * FROM trips WHERE id = $1', [tripId]);
    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    const trip = tripResult.rows[0];
    if (trip.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Trip is not active.' });
    }

    const now = new Date().toISOString();

    // 1. Update trip
    await db.query(
      `UPDATE trips
       SET current_lat = $1, current_lng = $2, current_speed = $3,
           current_heading = $4, current_accuracy = $5, last_telemetry_at = $6
       WHERE id = $7`,
      [lat, lng, speed, heading, accuracy, now, tripId]
    );

    // 2. Insert telemetry record
    const telemetryId = crypto.randomUUID();
    await db.query(
      `INSERT INTO gps_telemetry (id, trip_id, lat, lng, speed, heading, accuracy, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [telemetryId, tripId, lat, lng, speed, heading, accuracy, now]
    );

    // 3. Calculate dynamic ETAs
    const stopsResult = await db.query(
      `SELECT * FROM stops WHERE route_id = $1 ORDER BY sequence_order ASC`,
      [trip.route_id]
    );

    const stopsWithEta = calculateStopsETA(lat, lng, speed, stopsResult.rows, trip.current_stop_id);

    const telemetryPayload = {
      tripId,
      collegeId: trip.college_id,
      routeId: trip.route_id,
      lat,
      lng,
      speed,
      heading,
      accuracy,
      lastTelemetryAt: now,
      stops: stopsWithEta
    };

    // Broadcast via socket
    if (ioInstance) {
      ioInstance.to(`trip:${tripId}`).emit('trip:telemetry', telemetryPayload);
      ioInstance.to(`college:${trip.college_id}`).emit('trip:telemetry', telemetryPayload);
    }

    res.json({ success: true, telemetry: telemetryPayload });
  } catch (err) {
    console.error('[Post Telemetry Error]:', err);
    res.status(500).json({ error: 'Failed to process telemetry.' });
  }
}

export async function updateOccupancy(req, res) {
  try {
    const { id } = req.params;
    const { occupancyStatus, passengerCount } = req.body;

    const tripResult = await db.query('SELECT * FROM trips WHERE id = $1', [id]);
    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    const trip = tripResult.rows[0];

    await db.query(
      `UPDATE trips SET occupancy_status = $1, passenger_count = $2 WHERE id = $3`,
      [occupancyStatus || trip.occupancy_status, passengerCount !== undefined ? passengerCount : trip.passenger_count, id]
    );

    const updatePayload = {
      tripId: id,
      collegeId: trip.college_id,
      occupancyStatus: occupancyStatus || trip.occupancy_status,
      passengerCount: passengerCount !== undefined ? passengerCount : trip.passenger_count
    };

    if (ioInstance) {
      ioInstance.to(`trip:${id}`).emit('trip:occupancy_update', updatePayload);
      ioInstance.to(`college:${trip.college_id}`).emit('trip:occupancy_update', updatePayload);
    }

    res.json(updatePayload);
  } catch (err) {
    console.error('[Update Occupancy Error]:', err);
    res.status(500).json({ error: 'Failed to update occupancy.' });
  }
}

export async function checkinStop(req, res) {
  try {
    const { id } = req.params;
    const { stopId } = req.body;

    const tripResult = await db.query('SELECT * FROM trips WHERE id = $1', [id]);
    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    const trip = tripResult.rows[0];
    const now = new Date().toISOString();

    await db.query('UPDATE trips SET current_stop_id = $1 WHERE id = $2', [stopId, id]);

    // Record stop event
    const eventId = crypto.randomUUID();
    await db.query(
      `INSERT INTO trip_stop_events (id, trip_id, stop_id, event_type, timestamp)
       VALUES ($1, $2, $3, 'ARRIVED', $4)`,
      [eventId, id, stopId, now]
    );

    const payload = { tripId: id, stopId, arrivedAt: now };
    if (ioInstance) {
      ioInstance.to(`trip:${id}`).emit('trip:stop_checkin', payload);
      ioInstance.to(`college:${trip.college_id}`).emit('trip:stop_checkin', payload);
    }

    res.json(payload);
  } catch (err) {
    console.error('[Checkin Stop Error]:', err);
    res.status(500).json({ error: 'Failed to check in at stop.' });
  }
}

// Internal helper
async function fetchTripDetails(tripId, collegeId) {
  const result = await db.query(
    `SELECT t.*,
            b.bus_number, b.license_plate, b.capacity as bus_capacity, b.model as bus_model,
            r.name as route_name, r.code as route_code, r.color as route_color,
            r.origin as route_origin, r.destination as route_destination, r.path_coordinates,
            u.name as driver_name, u.phone as driver_phone
     FROM trips t
     JOIN buses b ON t.bus_id = b.id
     JOIN routes r ON t.route_id = r.id
     JOIN users u ON t.driver_id = u.id
     WHERE t.id = $1 AND t.college_id = $2`,
    [tripId, collegeId]
  );

  if (result.rows.length === 0) return null;

  const trip = result.rows[0];
  let pathCoords = [];
  try {
    pathCoords = typeof trip.path_coordinates === 'string' ? JSON.parse(trip.path_coordinates) : (trip.path_coordinates || []);
  } catch (e) {
    pathCoords = [];
  }

  const stopsResult = await db.query(
    `SELECT * FROM stops WHERE route_id = $1 ORDER BY sequence_order ASC`,
    [trip.route_id]
  );

  const stopsWithEta = calculateStopsETA(
    trip.current_lat,
    trip.current_lng,
    trip.current_speed,
    stopsResult.rows,
    trip.current_stop_id
  );

  return {
    ...trip,
    path_coordinates: pathCoords,
    stops: stopsWithEta
  };
}
