import { Router } from 'express';
import { getColleges, getCollegeBySlug, createCollege } from '../controllers/collegeController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Public routes for college directory and tenant selection
router.get('/', getColleges);
router.get('/:slug', getCollegeBySlug);

// Admin-only creation
router.post('/', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), createCollege);

export default router;
