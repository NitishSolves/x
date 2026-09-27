import { Router } from 'express';
import { getAlerts, createAlert, resolveAlert } from '../controllers/alertController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// All users can see active college alerts
router.get('/', getAlerts);

// Admin and Drivers can dispatch alerts
router.post('/', requireRole('ADMIN', 'DRIVER', 'SUPER_ADMIN'), createAlert);

// Admin can resolve alerts
router.put('/:id/resolve', requireRole('ADMIN', 'SUPER_ADMIN'), resolveAlert);

export default router;
