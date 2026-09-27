import crypto from 'node:crypto';
import db from '../config/db.js';

export async function getRoutes(req, res) {
  try {
    const collegeId = req.user.collegeId;

    const result = await db.query(
      `SELECT r.*,
              (SELECT COUNT(*) FROM stops s WHERE s.route_id = r.id) as stop_count,
              (SELECT COUNT(*) FROM trips t WHERE t.route_id = r.id AND t.status = 'IN_PROGRESS') as active_trips_count
       FROM routes r
       WHERE r.college_id = $1 AND r.is_active = 1
       ORDER BY r.code ASC`,
      [collegeId]
    );

    // Parse path_coordinates if string
    const routes = result.rows.map(row => {
      let pathCoords = [];
      try {
        pathCoords = typeof row.path_coordinates === 'string' ? JSON.parse(row.path_coordinates) : (row.path_coordinates || []);
      } catch (e) {
        pathCoords = [];
      }
      return {
        ...row,
        path_coordinates: pathCoords
      };
    });

    res.json(routes);
  } catch (err) {
    console.error('[Routes Get Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve routes.' });
  }
}

export async function getRouteById(req, res) {
  try {
    const collegeId = req.user.collegeId;
    const { id } = req.params;

    const routeResult = await db.query(
      `SELECT r.*
       FROM routes r
       WHERE r.id = $1 AND r.college_id = $2`,
      [id, collegeId]
    );

    if (routeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found.' });
    }

    const route = routeResult.rows[0];
    let pathCoords = [];
    try {
      pathCoords = typeof route.path_coordinates === 'string' ? JSON.parse(route.path_coordinates) : (route.path_coordinates || []);
    } catch (e) {
      pathCoords = [];
    }

    // Get stops
    const stopsResult = await db.query(
      `SELECT * FROM stops WHERE route_id = $1 ORDER BY sequence_order ASC`,
      [id]
    );

    // Check for active trip
    const tripResult = await db.query(
      `SELECT t.*, b.bus_number, b.license_plate, b.capacity, u.name as driver_name, u.phone as driver_phone
       FROM trips t
       JOIN buses b ON t.bus_id = b.id
       JOIN users u ON t.driver_id = u.id
       WHERE t.route_id = $1 AND t.status = 'IN_PROGRESS'
       LIMIT 1`,
      [id]
    );

    res.json({
      ...route,
      path_coordinates: pathCoords,
      stops: stopsResult.rows,
      activeTrip: tripResult.rows.length > 0 ? tripResult.rows[0] : null
    });
  } catch (err) {
    console.error('[Route By ID Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve route details.' });
  }
}

export async function createRoute(req, res) {
  try {
    const collegeId = req.user.collegeId;
    const { name, code, origin, destination, pathCoordinates = [], color = '#2563eb' } = req.body;

    if (!name || !code || !origin || !destination) {
      return res.status(400).json({ error: 'Name, route code, origin, and destination are required.' });
    }

    const routeId = crypto.randomUUID();
    const coordsJson = typeof pathCoordinates === 'string' ? pathCoordinates : JSON.stringify(pathCoordinates);

    await db.query(
      `INSERT INTO routes (id, college_id, name, code, origin, destination, path_coordinates, color, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)`,
      [routeId, collegeId, name.trim(), code.trim().toUpperCase(), origin.trim(), destination.trim(), coordsJson, color]
    );

    res.status(201).json({
      id: routeId,
      collegeId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      origin: origin.trim(),
      destination: destination.trim(),
      path_coordinates: pathCoordinates,
      color
    });
  } catch (err) {
    console.error('[Route Create Error]:', err);
    res.status(500).json({ error: 'Failed to create route.' });
  }
}

export async function updateRoute(req, res) {
  try {
    const collegeId = req.user.collegeId;
    const { id } = req.params;
    const { name, code, origin, destination, pathCoordinates, color, isActive } = req.body;

    const existing = await db.query('SELECT * FROM routes WHERE id = $1 AND college_id = $2', [id, collegeId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found.' });
    }

    const current = existing.rows[0];
    const coordsJson = pathCoordinates !== undefined
      ? (typeof pathCoordinates === 'string' ? pathCoordinates : JSON.stringify(pathCoordinates))
      : current.path_coordinates;

    await db.query(
      `UPDATE routes
       SET name = $1, code = $2, origin = $3, destination = $4, path_coordinates = $5, color = $6, is_active = $7
       WHERE id = $8 AND college_id = $9`,
      [
        name !== undefined ? name.trim() : current.name,
        code !== undefined ? code.trim().toUpperCase() : current.code,
        origin !== undefined ? origin.trim() : current.origin,
        destination !== undefined ? destination.trim() : current.destination,
        coordsJson,
        color !== undefined ? color : current.color,
        isActive !== undefined ? (isActive ? 1 : 0) : current.is_active,
        id,
        collegeId
      ]
    );

    res.json({ message: 'Route updated successfully.' });
  } catch (err) {
    console.error('[Route Update Error]:', err);
    res.status(500).json({ error: 'Failed to update route.' });
  }
}

export async function deleteRoute(req, res) {
  try {
    const collegeId = req.user.collegeId;
    const { id } = req.params;

    const result = await db.query('DELETE FROM routes WHERE id = $1 AND college_id = $2', [id, collegeId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Route not found or already deleted.' });
    }

    res.json({ message: 'Route deleted successfully.' });
  } catch (err) {
    console.error('[Route Delete Error]:', err);
    res.status(500).json({ error: 'Failed to delete route.' });
  }
}
