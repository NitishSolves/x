import { Router } from 'express';
import { getBuses, createBus, updateBus, deleteBus } from '../controllers/busController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// All bus endpoints require authentication and college tenant
router.use(authenticateToken);

router.get('/', getBuses);
router.post('/', requireRole('ADMIN', 'SUPER_ADMIN'), createBus);
router.put('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), updateBus);
router.delete('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), deleteBus);

export default router;
