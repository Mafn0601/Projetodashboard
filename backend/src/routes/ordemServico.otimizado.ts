import { Router } from 'express';
import ordemServicoController from '../controllers/ordemServicoController';
import { authenticate } from '../middlewares/auth';

/**
 * ✅ OTIMIZADO: Rotas de Ordem de Serviço
 * 
 * Mudanças principais:
 * 1. Novo endpoint GET /os/by-parceiro/:parceiroId
 *    - Para '/cadastros/parceiro/[id]/page.tsx' buscar OSs de um parceiro
 *    - Muito mais eficiente que carregar todas e filtrar no frontend
 * 
 * 2. Novo endpoint GET /os/stats
 *    - Para dashboard com contagem por status
 *    - Usa aggregation, não carrega dados completos
 * 
 * 3. GET /os com suporte a paginação
 *    - ?skip=0&take=20&status=CONCLUIDO&parceiroId=xyz
 * 
 * IMPORTANTE: Manter compatibilidade com rotas antigas!
 * Rotas específicas (/by-parceiro, /stats) ANTES de rotas com :id
 */

const router = Router();

// Middleware de autenticação em todas as rotas
router.use(authenticate);

// ✅ NOVO + ESPECÍFICAS: Devem vir ANTES das rotas com :id
router.get('/by-parceiro/:parceiroId', ordemServicoController.findByParceiro);
router.get('/stats', ordemServicoController.getStats);

// CRUD padrão
router.get('/', ordemServicoController.findAll);
router.get('/:id', ordemServicoController.findById);
router.post('/', ordemServicoController.create);
router.put('/:id', ordemServicoController.update);
router.delete('/:id', ordemServicoController.delete);

/**
 * ✅ MAPEAMENTO NOVO DE ENDPOINTS
 * 
 * Frontend                                Backend
 * 
 * /cadastros/parceiro/[id]               GET /os/by-parceiro/:parceiroId?skip=0&take=20
 * ├─ Antes: findAll({ take: 200 })       (nova query otimizada)
 * │  .filter(os => os.parceiroId === id)
 * └─ Depois: by-parceiro endpoint
 * 
 * /vendas/orcamento                      GET /os/stats
 * ├─ Dashboard com stats                 (aggregation, não full data)
 * └─ findAll({ take: 200 })
 * 
 * Qualquer página com tabela OS          GET /os?skip=0&take=20&status=CONCLUIDO
 * └─ Paginação + filtros eficientes
 * 
 * Detalhes de uma OS específica          GET /os/:id
 * └─ Inclui relacionamentos completos
 */

export default router;
