import { Router } from 'express';
import { getDrivers, createDriver, updateDriver } from '../controllers/driverController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRole('ADMIN', 'SUPER_ADMIN'));

router.get('/', getDrivers);
router.post('/', createDriver);
router.put('/:id', updateDriver);

export default router;
