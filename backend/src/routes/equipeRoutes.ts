import { Router } from 'express';
import equipeController from '../controllers/equipeController';

const router = Router();

router.get('/', equipeController.findAll);
router.get('/:id', equipeController.findById);
router.post('/', equipeController.create);
router.put('/:id', equipeController.update);
router.delete('/:id', equipeController.delete);

export default router;
