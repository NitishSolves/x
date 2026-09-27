import { Router } from 'express';
import { getRoutes, getRouteById, createRoute, updateRoute, deleteRoute } from '../controllers/routeController.js';
import { getStopsByRoute, createStop } from '../controllers/stopController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getRoutes);
router.get('/:id', getRouteById);
router.get('/:routeId/stops', getStopsByRoute);

router.post('/', requireRole('ADMIN', 'SUPER_ADMIN'), createRoute);
router.put('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), updateRoute);
router.delete('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), deleteRoute);

router.post('/:routeId/stops', requireRole('ADMIN', 'SUPER_ADMIN'), createStop);

export default router;
