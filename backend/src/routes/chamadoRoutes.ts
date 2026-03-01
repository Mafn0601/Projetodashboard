import { Router } from 'express';
import { chamadoController } from '../controllers/chamadoController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Rota pública para criar chamado (não precisa de autenticação)
router.post('/', chamadoController.criar);

// Rotas protegidas (apenas para administradores gerenciarem)
router.get('/', authMiddleware, chamadoController.listarTodos);
router.get('/:id', authMiddleware, chamadoController.buscarPorId);
router.patch('/:id/status', authMiddleware, chamadoController.atualizarStatus);
router.delete('/:id', authMiddleware, chamadoController.deletar);

export default router;
