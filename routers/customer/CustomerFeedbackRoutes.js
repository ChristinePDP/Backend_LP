import express from 'express';
// Siguraduhing na-import yung 'checkFeedbackStatus'
import { getAllFeedbacks, createFeedback, checkFeedbackStatus } from '../../controller/customer/CustomerFeedbackController.js';

const router = express.Router();

router.get('/', getAllFeedbacks);
router.post('/', createFeedback);

// ITO ANG KULANG: Ang daanan para sa checking
router.get('/check-status/:ref', checkFeedbackStatus);

export default router;