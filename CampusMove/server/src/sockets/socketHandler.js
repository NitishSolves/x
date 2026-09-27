import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import crypto from 'node:crypto';
import { validateTelemetry, calculateStopsETA } from '../services/gpsService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-campusmove-jwt-key-change-in-production-2026';

export function setupSocketIO(io) {
  // Authentication middleware for Socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication error: Token required.'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const userResult = await db.query(
        'SELECT id, college_id, name, email, role, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
        return next(new Error('Authentication error: User invalid or inactive.'));
      }

      socket.user = userResult.rows[0];
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token.'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    const collegeRoom = `college:${user.college_id}`;
    socket.join(collegeRoom);

    console.log(`[Socket] User connected: ${user.name} (${user.role}) | Joined: ${collegeRoom}`);

    // Allow client to join specific trip room for high-frequency GPS stream
    socket.on('join:trip', (tripId) => {
      if (tripId) {
        socket.join(`trip:${tripId}`);
        console.log(`[Socket] ${user.name} joined trip room: trip:${tripId}`);
      }
    });

    socket.on('leave:trip', (tripId) => {
      if (tripId) {
        socket.leave(`trip:${tripId}`);
        console.log(`[Socket] ${user.name} left trip room: trip:${tripId}`);
      }
    });

    // Driver live GPS telemetry broadcast
    socket.on('driver:telemetry', async (data) => {
      try {
        if (user.role !== 'DRIVER' && user.role !== 'ADMIN') {
          return socket.emit('error', { message: 'Only drivers/admins can broadcast telemetry.' });
        }

        const { tripId, lat, lng, speed = 0, heading = 0, accuracy = 5 } = data;

        const validation = validateTelemetry({ lat, lng, speed, heading, accuracy });
        if (!validation.valid) {
          return socket.emit('telemetry:error', { error: validation.error });
        }

        const tripResult = await db.query('SELECT * FROM trips WHERE id = $1', [tripId]);
        if (tripResult.rows.length === 0) {
          return socket.emit('telemetry:error', { error: 'Trip not found.' });
        }

        const trip = tripResult.rows[0];
        if (trip.status !== 'IN_PROGRESS') {
          return socket.emit('telemetry:error', { error: 'Trip is not currently active.' });
        }

        const now = new Date().toISOString();

        // 1. Update live coordinates in trips table
        await db.query(
          `UPDATE trips
           SET current_lat = $1, current_lng = $2, current_speed = $3,
               current_heading = $4, current_accuracy = $5, last_telemetry_at = $6
           WHERE id = $7`,
          [lat, lng, speed, heading, accuracy, now, tripId]
        );

        // 2. Append to telemetry history breadcrumb
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

        const payload = {
          tripId,
          collegeId: trip.college_id,
          routeId: trip.route_id,
          busId: trip.bus_id,
          lat,
          lng,
          speed,
          heading,
          accuracy,
          lastTelemetryAt: now,
          stops: stopsWithEta
        };

        // Broadcast to everyone tracking this trip or viewing this college's live map
        io.to(`trip:${tripId}`).emit('trip:telemetry', payload);
        io.to(`college:${trip.college_id}`).emit('trip:telemetry', payload);

        // Acknowledge back to driver
        socket.emit('telemetry:ack', { success: true, timestamp: now });
      } catch (err) {
        console.error('[Socket Telemetry Error]:', err);
        socket.emit('telemetry:error', { error: 'Internal telemetry processing error.' });
      }
    });

    // Driver occupancy status change
    socket.on('driver:occupancy_update', async ({ tripId, occupancyStatus, passengerCount }) => {
      try {
        const tripResult = await db.query('SELECT * FROM trips WHERE id = $1', [tripId]);
        if (tripResult.rows.length === 0) return;

        const trip = tripResult.rows[0];
        await db.query(
          `UPDATE trips SET occupancy_status = $1, passenger_count = $2 WHERE id = $3`,
          [occupancyStatus || trip.occupancy_status, passengerCount !== undefined ? passengerCount : trip.passenger_count, tripId]
        );

        const payload = {
          tripId,
          collegeId: trip.college_id,
          occupancyStatus: occupancyStatus || trip.occupancy_status,
          passengerCount: passengerCount !== undefined ? passengerCount : trip.passenger_count
        };

        io.to(`trip:${tripId}`).emit('trip:occupancy_update', payload);
        io.to(`college:${trip.college_id}`).emit('trip:occupancy_update', payload);
      } catch (err) {
        console.error('[Socket Occupancy Error]:', err);
      }
    });

    // Driver stop arrival check-in
    socket.on('driver:stop_checkin', async ({ tripId, stopId }) => {
      try {
        const tripResult = await db.query('SELECT * FROM trips WHERE id = $1', [tripId]);
        if (tripResult.rows.length === 0) return;

        const trip = tripResult.rows[0];
        const now = new Date().toISOString();

        await db.query('UPDATE trips SET current_stop_id = $1 WHERE id = $2', [stopId, tripId]);

        const eventId = crypto.randomUUID();
        await db.query(
          `INSERT INTO trip_stop_events (id, trip_id, stop_id, event_type, timestamp)
           VALUES ($1, $2, $3, 'ARRIVED', $4)`,
          [eventId, tripId, stopId, now]
        );

        const payload = { tripId, stopId, arrivedAt: now };
        io.to(`trip:${tripId}`).emit('trip:stop_checkin', payload);
        io.to(`college:${trip.college_id}`).emit('trip:stop_checkin', payload);
      } catch (err) {
        console.error('[Socket Checkin Error]:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${user.name}`);
    });
  });
}
