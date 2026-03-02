import { Router } from 'express';
import authRoutes from './authRoutes';
import clienteRoutes from './clienteRoutes';
import parceiroRoutes from './parceiroRoutes';
import veiculoRoutes from './veiculoRoutes';
import agendamentoRoutes from './agendamentoRoutes';
import ordemServicoRoutes from './ordemServicoRoutes';
import chamadoRoutes from './chamadoRoutes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Rotas da API
router.use('/auth', authRoutes);
router.use('/clientes', clienteRoutes);
router.use('/parceiros', parceiroRoutes);
router.use('/veiculos', veiculoRoutes);
router.use('/agendamentos', agendamentoRoutes);
router.use('/ordens-servico', ordemServicoRoutes);
router.use('/chamados', chamadoRoutes);

export default router;
