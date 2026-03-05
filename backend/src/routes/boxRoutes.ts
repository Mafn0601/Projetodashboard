import { Router } from 'express';
import boxController from '../controllers/boxController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Todas as rotas de box requerem autenticação
router.use(authenticate);

router.get('/', boxController.findAll);
router.get('/:id', boxController.findById);
router.post('/', boxController.create);
router.put('/:id', boxController.update);
router.delete('/:id', boxController.delete);

export default router;
