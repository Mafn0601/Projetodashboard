import { Router } from 'express';
import tipoOSController from '../controllers/tipoOSController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Todas as rotas de tipo OS requerem autenticação
router.use(authenticate);

// Rotas para Tipos de OS
router.get('/', tipoOSController.findAll);
router.get('/:id', tipoOSController.findById);
router.post('/', tipoOSController.create);
router.put('/:id', tipoOSController.update);
router.delete('/:id', tipoOSController.delete);

// Rotas para Itens de Tipo OS
router.post('/itens', tipoOSController.createItem);
router.put('/itens/:id', tipoOSController.updateItem);
router.delete('/itens/:id', tipoOSController.deleteItem);

export default router;
