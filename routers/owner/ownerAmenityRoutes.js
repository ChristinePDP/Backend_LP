import express from 'express';
import OwnerAmenityController from '../../controller/owner/OwnerAmenityController.js';
import upload from '../../middleware/upload.js'; 

const router = express.Router();

router.get('/', OwnerAmenityController.getAll);
router.post('/', upload.single('image'), OwnerAmenityController.create);
router.put('/:id', upload.single('image'), OwnerAmenityController.update);
router.delete('/:id', OwnerAmenityController.delete);

export default router;