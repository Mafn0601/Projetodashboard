import { Router } from 'express';
import statusController from '../controllers/statusController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Todas as rotas de status requerem autenticação
router.use(authenticate);

router.get('/', statusController.findAll);
router.get('/status/:status', statusController.findByStatus);
router.get('/:id', statusController.findById);
router.post('/', statusController.create);
router.put('/:id', statusController.update);
router.put('/:id/move', statusController.moveCard);
router.delete('/:id', statusController.delete);

export default router;
