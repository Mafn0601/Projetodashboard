import { Router } from 'express';
import financeiroController from '../controllers/financeiroController';
import { authenticate, authorize } from '../../../middlewares/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'DONO', 'GERENTE', 'FINANCEIRO'));

router.get('/dashboard', financeiroController.dashboard);
router.get('/contas-receber', financeiroController.contasReceber);
router.get('/contas-pagar', financeiroController.contasPagar);
router.get('/fluxo-caixa', financeiroController.fluxoCaixa);
router.get('/relatorios', financeiroController.relatorios);
router.get('/configuracoes', financeiroController.configuracoes);

router.post('/faturas', financeiroController.createFatura);
router.patch('/faturas/:id', financeiroController.updateFatura);
router.delete('/faturas/:id', financeiroController.deleteFatura);

router.post('/pagamentos', financeiroController.createPagamento);
router.patch('/pagamentos/:id', financeiroController.updatePagamento);

export default router;
