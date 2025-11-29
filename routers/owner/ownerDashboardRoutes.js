import express from 'express';
const router = express.Router();
import OwnerDashboardController from '../../controller/owner/OwnerDashboardController.js';

// Stats
router.get('/dashboard/stats', OwnerDashboardController.getStats);

// Sales
router.get('/sales', OwnerDashboardController.getSales); 
router.get('/sales/history', OwnerDashboardController.getSalesHistory);
router.get('/sales/years', OwnerDashboardController.getYears);

// Feedback
router.get('/feedback', OwnerDashboardController.getFeedback);

export default router;