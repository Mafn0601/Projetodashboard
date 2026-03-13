import { Router } from 'express';
import tipoOSController from '../controllers/tipoOSController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

// leitura: todos autenticados
router.get('/', tipoOSController.findAll);
router.get('/:id', tipoOSController.findById);

// escrita: somente admin e gerente
router.post('/', authorize('ADMIN', 'GERENTE'), tipoOSController.create);
router.put('/:id', authorize('ADMIN', 'GERENTE'), tipoOSController.update);
router.delete('/:id', authorize('ADMIN', 'GERENTE'), tipoOSController.delete);

// itens: somente admin e gerente
router.post('/itens', authorize('ADMIN', 'GERENTE'), tipoOSController.createItem);
router.put('/itens/:id', authorize('ADMIN', 'GERENTE'), tipoOSController.updateItem);
router.delete('/itens/:id', authorize('ADMIN', 'GERENTE'), tipoOSController.deleteItem);

export default router;
