import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import db from '../config/db.js';

export async function getDrivers(req, res) {
  try {
    const collegeId = req.user.collegeId;

    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.license_number, u.is_active, u.created_at,
              b.id as assigned_bus_id, b.bus_number as assigned_bus_number, b.license_plate as assigned_bus_plate,
              (SELECT t.id FROM trips t WHERE t.driver_id = u.id AND t.status = 'IN_PROGRESS' LIMIT 1) as active_trip_id
       FROM users u
       LEFT JOIN buses b ON b.default_driver_id = u.id
       WHERE u.college_id = $1 AND u.role = 'DRIVER'
       ORDER BY u.name ASC`,
      [collegeId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('[Drivers Get Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve drivers.' });
  }
}

export async function createDriver(req, res) {
  try {
    const collegeId = req.user.collegeId;
    const { name, email, password = 'driver123', phone, licenseNumber } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Driver name and email are required.' });
    }

    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const driverId = crypto.randomUUID();

    await db.query(
      `INSERT INTO users (id, college_id, name, email, password_hash, role, phone, license_number, is_active)
       VALUES ($1, $2, $3, $4, $5, 'DRIVER', $6, $7, 1)`,
      [driverId, collegeId, name.trim(), email.trim(), passwordHash, phone || null, licenseNumber || null]
    );

    res.status(201).json({
      id: driverId,
      collegeId,
      name: name.trim(),
      email: email.trim(),
      role: 'DRIVER',
      phone,
      licenseNumber
    });
  } catch (err) {
    console.error('[Driver Create Error]:', err);
    res.status(500).json({ error: 'Failed to create driver account.' });
  }
}

export async function updateDriver(req, res) {
  try {
    const collegeId = req.user.collegeId;
    const { id } = req.params;
    const { name, phone, licenseNumber, isActive } = req.body;

    const existing = await db.query('SELECT * FROM users WHERE id = $1 AND college_id = $2 AND role = $3', [id, collegeId, 'DRIVER']);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found.' });
    }

    const current = existing.rows[0];

    await db.query(
      `UPDATE users
       SET name = $1, phone = $2, license_number = $3, is_active = $4
       WHERE id = $5 AND college_id = $6`,
      [
        name !== undefined ? name.trim() : current.name,
        phone !== undefined ? phone : current.phone,
        licenseNumber !== undefined ? licenseNumber : current.license_number,
        isActive !== undefined ? (isActive ? 1 : 0) : current.is_active,
        id,
        collegeId
      ]
    );

    res.json({ message: 'Driver updated successfully.' });
  } catch (err) {
    console.error('[Driver Update Error]:', err);
    res.status(500).json({ error: 'Failed to update driver.' });
  }
}
