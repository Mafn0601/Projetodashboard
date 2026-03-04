import { Router } from 'express';
import authRoutes from './authRoutes';
import clienteRoutes from './clienteRoutes';
import parceiroRoutes from './parceiroRoutes';
import equipeRoutes from './equipeRoutes';
import veiculoRoutes from './veiculoRoutes';
import agendamentoRoutes from './agendamentoRoutes';
import ordemServicoRoutes from './ordemServicoRoutes';
import chamadoRoutes from './chamadoRoutes';
import viaCepRoutes from './viaCepRoutes';
import tipoOSRoutes from './tipoOSRoutes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Rotas da API
router.use('/auth', authRoutes);
router.use('/cep', viaCepRoutes);
router.use('/clientes', clienteRoutes);
router.use('/parceiros', parceiroRoutes);
router.use('/equipes', equipeRoutes);
router.use('/veiculos', veiculoRoutes);
router.use('/agendamentos', agendamentoRoutes);
router.use('/ordens-servico', ordemServicoRoutes);
router.use('/chamados', chamadoRoutes);
router.use('/tipos-os', tipoOSRoutes);

export default router;
