import { Router } from 'express';
import parceiroController from '../controllers/parceiroController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// leitura: qualquer usuário autenticado
router.use(authenticate);

router.get('/', parceiroController.findAll);
router.get('/:id', parceiroController.findById);

// escrita: somente ADMIN e GERENTE
router.post('/', authorize('ADMIN', 'GERENTE'), parceiroController.create);
router.put('/:id', authorize('ADMIN', 'GERENTE'), parceiroController.update);
router.delete('/:id', authorize('ADMIN', 'GERENTE'), parceiroController.delete);

export default router;
