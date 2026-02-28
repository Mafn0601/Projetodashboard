import { Router } from 'express';
import clienteController from '../controllers/clienteController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Todas as rotas de cliente requerem autenticação
router.use(authenticate);

router.get('/', clienteController.findAll);
router.get('/:id', clienteController.findById);
router.post('/', clienteController.create);
router.put('/:id', clienteController.update);
router.delete('/:id', clienteController.delete);

export default router;
