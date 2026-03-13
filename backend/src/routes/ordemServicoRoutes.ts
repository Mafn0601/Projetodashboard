import { Router } from 'express';
import ordemServicoController from '../controllers/ordemServicoController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

// rotas específicas (devem vir ANTES de /:id)
router.get('/by-parceiro/:parceiroId', ordemServicoController.findByParceiro);
router.get('/stats', ordemServicoController.getStats);

// leitura: todos autenticados
router.get('/', ordemServicoController.findAll);
router.get('/:id', ordemServicoController.findById);

// criação/edição: admin, gerente, consultor (VENDEDOR/PARCEIRO) e operacional
router.post('/', ordemServicoController.create);
router.put('/:id', ordemServicoController.update);
// atualização de status: admin, gerente, operacional
router.patch('/:id/status', authorize('ADMIN', 'GERENTE', 'OPERADOR'), ordemServicoController.updateStatus);
// exclusão: somente admin/gerente
router.delete('/:id', authorize('ADMIN', 'GERENTE'), ordemServicoController.delete);

export default router;
