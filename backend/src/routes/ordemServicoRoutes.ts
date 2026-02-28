import { Router } from 'express';
import ordemServicoController from '../controllers/ordemServicoController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Todas as rotas de OS requerem autenticação
router.use(authenticate);

router.get('/', ordemServicoController.findAll);
router.get('/:id', ordemServicoController.findById);
router.post('/', ordemServicoController.create);
router.put('/:id', ordemServicoController.update);
router.patch('/:id/status', ordemServicoController.updateStatus);
router.delete('/:id', ordemServicoController.delete);

export default router;
