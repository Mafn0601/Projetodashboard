import { Router } from 'express';
import agendamentoController from '../controllers/agendamentoController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Todas as rotas de agendamento requerem autenticação
router.use(authenticate);

router.get('/', agendamentoController.findAll);
router.get('/:id', agendamentoController.findById);
router.post('/', agendamentoController.create);
router.put('/:id', agendamentoController.update);
router.delete('/:id', agendamentoController.delete);

export default router;
