import crypto from 'node:crypto';
import db from '../config/db.js';

let ioInstance = null;
export function setAlertSocketIO(io) {
  ioInstance = io;
}

export async function getAlerts(req, res) {
  try {
    const collegeId = req.user.collegeId;

    const result = await db.query(
      `SELECT a.*, r.name as route_name, r.code as route_code, b.bus_number, u.name as author_name
       FROM alerts a
       LEFT JOIN routes r ON a.route_id = r.id
       LEFT JOIN buses b ON a.bus_id = b.id
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.college_id = $1 AND a.is_active = 1
       ORDER BY a.created_at DESC`,
      [collegeId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('[Get Alerts Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve alerts.' });
  }
}

export async function createAlert(req, res) {
  try {
    const collegeId = req.user.collegeId;
    const userId = req.user.id;
    const { title, message, severity = 'INFO', routeId, busId, expiresAt } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Alert title and message are required.' });
    }

    const alertId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.query(
      `INSERT INTO alerts (id, college_id, route_id, bus_id, title, message, severity, is_active, created_by, created_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8, $9, $10)`,
      [alertId, collegeId, routeId || null, busId || null, title.trim(), message.trim(), severity.toUpperCase(), userId, now, expiresAt || null]
    );

    const alertPayload = {
      id: alertId,
      collegeId,
      routeId: routeId || null,
      busId: busId || null,
      title: title.trim(),
      message: message.trim(),
      severity: severity.toUpperCase(),
      isActive: 1,
      createdAt: now,
      authorName: req.user.name
    };

    if (ioInstance) {
      ioInstance.to(`college:${collegeId}`).emit('alert:broadcast', alertPayload);
    }

    res.status(201).json(alertPayload);
  } catch (err) {
    console.error('[Create Alert Error]:', err);
    res.status(500).json({ error: 'Failed to create alert.' });
  }
}

export async function resolveAlert(req, res) {
  try {
    const collegeId = req.user.collegeId;
    const { id } = req.params;

    const result = await db.query(
      `UPDATE alerts SET is_active = 0 WHERE id = $1 AND college_id = $2`,
      [id, collegeId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Alert not found.' });
    }

    if (ioInstance) {
      ioInstance.to(`college:${collegeId}`).emit('alert:resolved', { alertId: id });
    }

    res.json({ message: 'Alert resolved successfully.', alertId: id });
  } catch (err) {
    console.error('[Resolve Alert Error]:', err);
    res.status(500).json({ error: 'Failed to resolve alert.' });
  }
}
