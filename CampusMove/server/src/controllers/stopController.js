import crypto from 'node:crypto';
import db from '../config/db.js';

export async function getStopsByRoute(req, res) {
  try {
    const { routeId } = req.params;
    const collegeId = req.user.collegeId;

    // Verify route belongs to user's college
    const routeCheck = await db.query('SELECT id FROM routes WHERE id = $1 AND college_id = $2', [routeId, collegeId]);
    if (routeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found.' });
    }

    const result = await db.query(
      `SELECT * FROM stops WHERE route_id = $1 ORDER BY sequence_order ASC`,
      [routeId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('[Stops Get Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve stops.' });
  }
}

export async function createStop(req, res) {
  try {
    const { routeId } = req.params;
    const collegeId = req.user.collegeId;
    const { name, landmark, lat, lng, sequenceOrder, scheduledTime, geofenceRadius = 100 } = req.body;

    if (!name || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Stop name, latitude, and longitude are required.' });
    }

    // Verify route belongs to college
    const routeCheck = await db.query('SELECT id FROM routes WHERE id = $1 AND college_id = $2', [routeId, collegeId]);
    if (routeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found.' });
    }

    // If sequenceOrder not given, put at end
    let order = sequenceOrder;
    if (order === undefined) {
      const maxOrder = await db.query('SELECT MAX(sequence_order) as max_seq FROM stops WHERE route_id = $1', [routeId]);
      order = (maxOrder.rows[0].max_seq || 0) + 1;
    }

    const stopId = crypto.randomUUID();
    await db.query(
      `INSERT INTO stops (id, college_id, route_id, name, landmark, lat, lng, sequence_order, scheduled_time, geofence_radius_meters)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [stopId, collegeId, routeId, name.trim(), landmark || null, lat, lng, order, scheduledTime || null, geofenceRadius]
    );

    res.status(201).json({
      id: stopId,
      collegeId,
      routeId,
      name: name.trim(),
      landmark,
      lat,
      lng,
      sequenceOrder: order,
      scheduledTime,
      geofenceRadius
    });
  } catch (err) {
    console.error('[Stop Create Error]:', err);
    res.status(500).json({ error: 'Failed to create stop.' });
  }
}

export async function updateStop(req, res) {
  try {
    const { id } = req.params;
    const collegeId = req.user.collegeId;
    const { name, landmark, lat, lng, sequenceOrder, scheduledTime, geofenceRadius } = req.body;

    const existing = await db.query('SELECT * FROM stops WHERE id = $1 AND college_id = $2', [id, collegeId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Stop not found.' });
    }

    const current = existing.rows[0];

    await db.query(
      `UPDATE stops
       SET name = $1, landmark = $2, lat = $3, lng = $4, sequence_order = $5, scheduled_time = $6, geofence_radius_meters = $7
       WHERE id = $8 AND college_id = $9`,
      [
        name !== undefined ? name.trim() : current.name,
        landmark !== undefined ? landmark : current.landmark,
        lat !== undefined ? lat : current.lat,
        lng !== undefined ? lng : current.lng,
        sequenceOrder !== undefined ? sequenceOrder : current.sequence_order,
        scheduledTime !== undefined ? scheduledTime : current.scheduled_time,
        geofenceRadius !== undefined ? geofenceRadius : current.geofence_radius_meters,
        id,
        collegeId
      ]
    );

    res.json({ message: 'Stop updated successfully.' });
  } catch (err) {
    console.error('[Stop Update Error]:', err);
    res.status(500).json({ error: 'Failed to update stop.' });
  }
}

export async function deleteStop(req, res) {
  try {
    const { id } = req.params;
    const collegeId = req.user.collegeId;

    const result = await db.query('DELETE FROM stops WHERE id = $1 AND college_id = $2', [id, collegeId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Stop not found or already deleted.' });
    }

    res.json({ message: 'Stop deleted successfully.' });
  } catch (err) {
    console.error('[Stop Delete Error]:', err);
    res.status(500).json({ error: 'Failed to delete stop.' });
  }
}
