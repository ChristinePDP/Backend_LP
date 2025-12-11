import express from 'express';
import TransactionController from '../controller/TransactionController.js';
import { uploadPayment } from '../middleware/upload.js'; 
import { protect } from '../middleware/authMiddleware.js'; 

const router = express.Router();

router.post('/', 
    protect, 
    uploadPayment.single('proof_of_payment'),
    TransactionController.create
);

// 👇 IDAGDAG MO ITO DITO (Bago ang ibang GET routes)
// Ito ang magko-connect sa function na ginawa natin sa Controller
router.get('/check-availability', TransactionController.checkDateAvailability);

// Existing routes...
router.get('/', protect, TransactionController.getAll);
router.get('/customer', TransactionController.getByCustomer);
router.get('/today', TransactionController.getTodaysBookings);

// ⚠️ Ang :transaction_ref ay dapat nasa ilalim ng specific routes tulad ng /check-availability at /today
router.get('/:transaction_ref', TransactionController.getByRef);

router.get('/user/:userId', TransactionController.getByUserId);
router.put('/:transaction_id/status', TransactionController.updateStatus);
router.put('/:transaction_id/payment-status', TransactionController.updatePaymentStatus);
router.put('/:transaction_id/cancel', TransactionController.cancel);

router.put('/:transaction_id/update-total', TransactionController.updateTransactionTotal);

export default router;