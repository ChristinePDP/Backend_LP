import express from 'express';
// 👇 FIX 1: Remove { } brackets. Import the whole object.
import CustomerAmController from '../../controller/customer/CustomerAmController.js';

const router = express.Router();

// 👇 FIX 2: Use the correct method names defined in the controller (getAll, getById, getFeatured)

// Order matters! 'featured' must come BEFORE '/:id'
router.get('/featured', CustomerAmController.getFeatured); 

router.get('/', CustomerAmController.getAll);
router.get('/:id', CustomerAmController.getById);

export default router;