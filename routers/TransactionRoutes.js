import express from 'express';
import TransactionController from '../controller/TransactionController.js';
import upload from '../middleware/upload.js';


const router = express.Router();

// Create transaction with file upload
router.post('/', 
    upload.single('proof_of_payment'),
    TransactionController.create
);

// Test upload endpoint
router.post('/test-upload', 
    upload.single('proof_of_payment'),
    (req, res) => {
        console.log('📄 Test upload - File:', req.file);
        console.log('📄 Test upload - Body:', req.body);
        
        res.json({
            success: true,
            message: 'Upload test successful',
            file: req.file ? {
                filename: req.file.filename,
                originalname: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype
            } : null
        });
    }
);

// Other transaction routes
router.get('/', TransactionController.getAll);
router.get('/customer', TransactionController.getByCustomer);
router.get('/:transaction_ref', TransactionController.getByRef);
router.put('/:transaction_id/status', TransactionController.updateStatus);
router.put('/:transaction_id/payment-status', TransactionController.updatePaymentStatus);
router.put('/:transaction_id/cancel', TransactionController.cancel);

export default router;