import { Router } from 'express';
import { updateStop, deleteStop } from '../controllers/stopController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRole('ADMIN', 'SUPER_ADMIN'));

router.put('/:id', updateStop);
router.delete('/:id', deleteStop);

export default router;
