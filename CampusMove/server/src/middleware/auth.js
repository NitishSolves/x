import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-campusmove-jwt-key-change-in-production-2026';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch fresh user record from database
    const userResult = await db.query(
      `SELECT u.id, u.college_id, u.name, u.email, u.role, u.is_active, c.name as college_name, c.slug as college_slug
       FROM users u
       JOIN colleges c ON u.college_id = c.id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token: User not found.' });
    }

    const user = userResult.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account has been deactivated.' });
    }

    req.user = {
      id: user.id,
      collegeId: user.college_id,
      collegeName: user.college_name,
      collegeSlug: user.college_slug,
      name: user.name,
      email: user.email,
      role: user.role
    };

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Middleware to restrict endpoints to specified roles
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Unauthorized. Required role: [${allowedRoles.join(', ')}]. Current role: ${req.user ? req.user.role : 'none'}`
      });
    }
    next();
  };
}

/**
 * Multi-tenant isolation helper
 */
export function ensureTenantAccess(req, resourceCollegeId) {
  if (req.user.role === 'SUPER_ADMIN') return true;
  return req.user.collegeId === resourceCollegeId;
}
