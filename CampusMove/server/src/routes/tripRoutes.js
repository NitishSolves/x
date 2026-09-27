import { Router } from 'express';
import {
  startTrip,
  endTrip,
  getActiveTrips,
  getTripById,
  postTelemetry,
  updateOccupancy,
  checkinStop
} from '../controllers/tripController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// Read active trips (Students, Drivers, Admins)
router.get('/active', getActiveTrips);
router.get('/:id', getTripById);

// Driver operational endpoints
router.post('/start', requireRole('DRIVER', 'ADMIN', 'SUPER_ADMIN'), startTrip);
router.post('/:id/end', requireRole('DRIVER', 'ADMIN', 'SUPER_ADMIN'), endTrip);
router.post('/telemetry', requireRole('DRIVER', 'ADMIN', 'SUPER_ADMIN'), postTelemetry);
router.post('/:id/occupancy', requireRole('DRIVER', 'ADMIN', 'SUPER_ADMIN'), updateOccupancy);
router.post('/:id/checkin', requireRole('DRIVER', 'ADMIN', 'SUPER_ADMIN'), checkinStop);

export default router;
