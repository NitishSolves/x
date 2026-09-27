import crypto from 'node:crypto';
import db from '../config/db.js';

export async function getColleges(req, res) {
  try {
    const result = await db.query(
      `SELECT id, name, slug, code, address, center_lat, center_lng, created_at
       FROM colleges
       ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[Colleges Get Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve colleges.' });
  }
}

export async function getCollegeBySlug(req, res) {
  try {
    const { slug } = req.params;
    const result = await db.query(
      `SELECT id, name, slug, code, address, center_lat, center_lng, created_at
       FROM colleges
       WHERE slug = $1`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'College not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[College By Slug Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve college details.' });
  }
}

export async function createCollege(req, res) {
  try {
    const { name, slug, code, address, centerLat, centerLng } = req.body;

    if (!name || !slug || !code) {
      return res.status(400).json({ error: 'College name, slug, and code are required.' });
    }

    const collegeId = crypto.randomUUID();
    await db.query(
      `INSERT INTO colleges (id, name, slug, code, address, center_lat, center_lng)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [collegeId, name.trim(), slug.trim().toLowerCase(), code.trim().toUpperCase(), address || null, centerLat || 0, centerLng || 0]
    );

    res.status(201).json({
      id: collegeId,
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      code: code.trim().toUpperCase(),
      address,
      centerLat,
      centerLng
    });
  } catch (err) {
    console.error('[College Create Error]:', err);
    res.status(500).json({ error: 'Failed to create college.' });
  }
}
