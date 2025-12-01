import express from 'express';
import { getAllFeedbacks, createFeedback } from '../../controller/customer/CustomerFeedbackController.js';

const router = express.Router();

// Ito ang tatawagin ng frontend: http://localhost:5000/api/feedbacks
router.get('/', getAllFeedbacks);
router.post('/', createFeedback);

export default router;