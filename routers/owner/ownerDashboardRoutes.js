import express from 'express';
const router = express.Router();
import OwnerDashboardController from '../../controller/owner/OwnerDashboardController.js';

import { protect, authorize } from '../../middleware/authMiddleware.js'; 

router.get('/analytics', protect, authorize('owner'), OwnerDashboardController.getAnalyticsData); 

router.get('/export', protect, authorize('owner'), OwnerDashboardController.exportData);

export default router;