import express from 'express';
import ReservationController from '../controller/ReservationController.js';

import { protect } from '../middleware/authMiddleware.js'; 

const router = express.Router();

router.get('/', protect, ReservationController.getAll);
router.get('/:id', protect, ReservationController.getById);
router.get('/user/:userId', protect, ReservationController.getByUserId);
router.put('/:id', protect, ReservationController.update);
router.put('/:id/extend', protect, ReservationController.extend);
router.delete('/:id', protect, ReservationController.delete);

export default router;