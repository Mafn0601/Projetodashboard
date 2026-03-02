import { Router } from 'express';
import parceiroController from '../controllers/parceiroController';

const router = Router();

router.get('/', parceiroController.findAll);
router.get('/:id', parceiroController.findById);
router.post('/', parceiroController.create);
router.put('/:id', parceiroController.update);
router.delete('/:id', parceiroController.delete);

export default router;
