import { Router } from 'express';
import { getDashboardStats } from '../controllers/analyticsController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRole('ADMIN', 'SUPER_ADMIN'));

router.get('/dashboard', getDashboardStats);

export default router;
