import { Router } from 'express';
import { chamadoController } from '../controllers/chamadoController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Rota pública para criar chamado (não precisa de autenticação)
router.post('/', chamadoController.criar);

// Rotas protegidas (apenas para administradores gerenciarem)
router.get('/', authenticate, chamadoController.listarTodos);
router.get('/:id', authenticate, chamadoController.buscarPorId);
router.patch('/:id/status', authenticate, chamadoController.atualizarStatus);
router.delete('/:id', authenticate, chamadoController.deletar);

export default router;
