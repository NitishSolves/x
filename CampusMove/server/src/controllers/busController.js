import crypto from 'node:crypto';
import db from '../config/db.js';

export async function getBuses(req, res) {
  try {
    const collegeId = req.user.collegeId;

    const result = await db.query(
      `SELECT b.*, u.name as default_driver_name, u.phone as default_driver_phone,
              (SELECT t.id FROM trips t WHERE t.bus_id = b.id AND t.status = 'IN_PROGRESS' LIMIT 1) as active_trip_id
       FROM buses b
       LEFT JOIN users u ON b.default_driver_id = u.id
       WHERE b.college_id = $1
       ORDER BY b.bus_number ASC`,
      [collegeId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('[Buses Get Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve buses.' });
  }
}

export async function createBus(req, res) {
  try {
    const collegeId = req.user.collegeId;
    const { busNumber, licensePlate, capacity = 40, model, status = 'ACTIVE', defaultDriverId } = req.body;

    if (!busNumber || !licensePlate) {
      return res.status(400).json({ error: 'Bus number and license plate are required.' });
    }

    const busId = crypto.randomUUID();
    await db.query(
      `INSERT INTO buses (id, college_id, bus_number, license_plate, capacity, model, status, default_driver_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [busId, collegeId, busNumber.trim(), licensePlate.trim(), capacity, model || null, status, defaultDriverId || null]
    );

    res.status(201).json({
      id: busId,
      collegeId,
      busNumber: busNumber.trim(),
      licensePlate: licensePlate.trim(),
      capacity,
      model,
      status,
      defaultDriverId
    });
  } catch (err) {
    console.error('[Bus Create Error]:', err);
    res.status(500).json({ error: 'Failed to create bus.' });
  }
}

export async function updateBus(req, res) {
  try {
    const collegeId = req.user.collegeId;
    const { id } = req.params;
    const { busNumber, licensePlate, capacity, model, status, defaultDriverId } = req.body;

    // Check ownership
    const existing = await db.query('SELECT * FROM buses WHERE id = $1 AND college_id = $2', [id, collegeId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Bus not found.' });
    }

    const current = existing.rows[0];

    await db.query(
      `UPDATE buses
       SET bus_number = $1, license_plate = $2, capacity = $3, model = $4, status = $5, default_driver_id = $6
       WHERE id = $7 AND college_id = $8`,
      [
        busNumber !== undefined ? busNumber.trim() : current.bus_number,
        licensePlate !== undefined ? licensePlate.trim() : current.license_plate,
        capacity !== undefined ? capacity : current.capacity,
        model !== undefined ? model : current.model,
        status !== undefined ? status : current.status,
        defaultDriverId !== undefined ? defaultDriverId : current.default_driver_id,
        id,
        collegeId
      ]
    );

    res.json({ message: 'Bus updated successfully.' });
  } catch (err) {
    console.error('[Bus Update Error]:', err);
    res.status(500).json({ error: 'Failed to update bus.' });
  }
}

export async function deleteBus(req, res) {
  try {
    const collegeId = req.user.collegeId;
    const { id } = req.params;

    const result = await db.query('DELETE FROM buses WHERE id = $1 AND college_id = $2', [id, collegeId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Bus not found or already deleted.' });
    }

    res.json({ message: 'Bus deleted successfully.' });
  } catch (err) {
    console.error('[Bus Delete Error]:', err);
    res.status(500).json({ error: 'Failed to delete bus.' });
  }
}
