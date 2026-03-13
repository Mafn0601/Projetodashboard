import { Router } from 'express';
import equipeController from '../controllers/equipeController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// leitura: qualquer usuário autenticado
router.use(authenticate);

router.get('/', equipeController.findAll);
router.get('/:id', equipeController.findById);

// escrita: somente ADMIN e GERENTE
router.post('/', authorize('ADMIN', 'GERENTE'), equipeController.create);
router.put('/:id', authorize('ADMIN', 'GERENTE'), equipeController.update);
router.delete('/:id', authorize('ADMIN', 'GERENTE'), equipeController.delete);

export default router;
