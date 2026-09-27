import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import db from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-campusmove-jwt-key-change-in-production-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userResult = await db.query(
      `SELECT u.*, c.name as college_name, c.slug as college_slug, c.code as college_code,
              c.center_lat, c.center_lng
       FROM users u
       JOIN colleges c ON u.college_id = c.id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email.trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account has been deactivated.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id, collegeId: user.college_id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        studentId: user.student_id,
        licenseNumber: user.license_number,
        college: {
          id: user.college_id,
          name: user.college_name,
          slug: user.college_slug,
          code: user.college_code,
          centerLat: user.center_lat,
          centerLng: user.center_lng
        }
      }
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
}

export async function register(req, res) {
  try {
    const { name, email, password, role = 'STUDENT', collegeId, phone, studentId, licenseNumber } = req.body;

    if (!name || !email || !password || !collegeId) {
      return res.status(400).json({ error: 'Name, email, password, and college selection are required.' });
    }

    // Role validation: only STUDENT or DRIVER can self-register; ADMIN requires existing admin
    const validRoles = ['STUDENT', 'DRIVER'];
    const assignedRole = validRoles.includes(role.toUpperCase()) ? role.toUpperCase() : 'STUDENT';

    // Verify college exists
    const collegeResult = await db.query('SELECT * FROM colleges WHERE id = $1', [collegeId]);
    if (collegeResult.rows.length === 0) {
      return res.status(400).json({ error: 'Selected college does not exist.' });
    }
    const college = collegeResult.rows[0];

    // Check email uniqueness
    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUserId = crypto.randomUUID();

    await db.query(
      `INSERT INTO users (id, college_id, name, email, password_hash, role, phone, student_id, license_number, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)`,
      [newUserId, collegeId, name.trim(), email.trim(), passwordHash, assignedRole, phone || null, studentId || null, licenseNumber || null]
    );

    const token = jwt.sign(
      { userId: newUserId, collegeId, role: assignedRole },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: {
        id: newUserId,
        name: name.trim(),
        email: email.trim(),
        role: assignedRole,
        phone,
        studentId,
        licenseNumber,
        college: {
          id: college.id,
          name: college.name,
          slug: college.slug,
          code: college.code,
          centerLat: college.center_lat,
          centerLng: college.center_lng
        }
      }
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
}

export async function getMe(req, res) {
  try {
    const userResult = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u.student_id, u.license_number,
              c.id as college_id, c.name as college_name, c.slug as college_slug, c.code as college_code,
              c.center_lat, c.center_lng
       FROM users u
       JOIN colleges c ON u.college_id = c.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userResult.rows[0];
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      studentId: user.student_id,
      licenseNumber: user.license_number,
      college: {
        id: user.college_id,
        name: user.college_name,
        slug: user.college_slug,
        code: user.college_code,
        centerLat: user.center_lat,
        centerLng: user.center_lng
      }
    });
  } catch (err) {
    console.error('[Auth Me Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
}
