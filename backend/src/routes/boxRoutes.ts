import { Router } from 'express';
import boxController from '../controllers/boxController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Todas as rotas de box requerem autenticação
router.use(authenticate);

router.get('/', boxController.findAll);
router.get('/:id', boxController.findById);
router.post('/', authorize('ADMIN', 'GERENTE'), boxController.create);
router.put('/:id', authorize('ADMIN', 'GERENTE'), boxController.update);
router.delete('/:id', authorize('ADMIN', 'GERENTE'), boxController.delete);

export default router;
