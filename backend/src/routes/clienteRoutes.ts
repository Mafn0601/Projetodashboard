import { Router } from 'express';
import clienteController from '../controllers/clienteController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', clienteController.findAll);
router.get('/:id', clienteController.findById);
router.post('/', clienteController.create);
router.put('/:id', clienteController.update);
// apenas admin/gerente podem remover clientes permanentemente
router.delete('/:id', authorize('ADMIN', 'GERENTE'), clienteController.delete);

export default router;
