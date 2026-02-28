import { z } from 'zod';

// ==================== AUTH ====================

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const registerSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  login: z.string().min(3, 'Login deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['ADMIN', 'GERENTE', 'OPERADOR', 'PARCEIRO']).optional(),
});

// ==================== CLIENTE ====================

export const createClienteSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido').optional(),
  telefone: z.string().min(10, 'Telefone inválido'),
  cpfCnpj: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
});

export const updateClienteSchema = createClienteSchema.partial();

// ==================== VEÍCULO ====================

export const createVeiculoSchema = z.object({
  placa: z.string().min(7, 'Placa inválida'),
  chassi: z.string().optional(),
  marca: z.string().min(2, 'Marca inválida'),
  modelo: z.string().min(2, 'Modelo inválido'),
  fabricante: z.string().optional(),
  anoFabricacao: z.string().optional(),
  anoModelo: z.string().optional(),
  cor: z.string().optional(),
  combustivel: z.string().optional(),
  clienteId: z.string().uuid('Cliente ID inválido'),
});

export const updateVeiculoSchema = createVeiculoSchema.partial();

// ==================== AGENDAMENTO ====================

export const createAgendamentoSchema = z.object({
  clienteId: z.string().uuid('Cliente ID inválido'),
  veiculoId: z.string().uuid('Veículo ID inválido').optional(),
  responsavelId: z.string().uuid('Responsável ID inválido'),
  parceiroId: z.string().uuid('Parceiro ID inválido').optional(),
  dataAgendamento: z.string().datetime('Data inválida'),
  horarioAgendamento: z.string().optional(),
  tipoAgendamento: z.string().min(3, 'Tipo de agendamento inválido'),
  descricaoServico: z.string().optional(),
  observacoes: z.string().optional(),
  quilometragem: z.string().optional(),
});

export const updateAgendamentoSchema = createAgendamentoSchema.partial().extend({
  status: z.enum(['CONFIRMADO', 'EXECUTANDO', 'FINALIZADO', 'CANCELADO']).optional(),
});

// ==================== ORDEM DE SERVIÇO ====================

export const createOrdemServicoSchema = z.object({
  clienteId: z.string().uuid('Cliente ID inválido'),
  veiculoId: z.string().uuid('Veículo ID inválido'),
  responsavelId: z.string().uuid('Responsável ID inválido'),
  parceiroId: z.string().uuid('Parceiro ID inválido').optional(),
  agendamentoId: z.string().uuid('Agendamento ID inválido').optional(),
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
  quilometragem: z.string().optional(),
  dataPrevisao: z.string().datetime('Data inválida').optional(),
  formaPagamento: z.string().optional(),
  meioPagamento: z.string().optional(),
  origemPedido: z.enum(['INTERNO', 'EXTERNO']).optional(),
  prioridade: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']).optional(),
});

export const updateOrdemServicoSchema = createOrdemServicoSchema.partial().extend({
  status: z.enum(['AGUARDANDO', 'EM_ATENDIMENTO', 'AGUARDANDO_PECAS', 'EM_EXECUCAO', 'CONCLUIDO', 'ENTREGUE']).optional(),
  valorTotal: z.number().optional(),
  valorDesconto: z.number().optional(),
  dataFinalizacao: z.string().datetime('Data inválida').optional(),
});

// ==================== PARCEIRO ====================

export const createParceiroSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  endereco: z.string().optional(),
});

export const updateParceiroSchema = createParceiroSchema.partial();

// ==================== TIPO OS ====================

export const createTipoOSSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  descricao: z.string().optional(),
});

export const createTipoOSItemSchema = z.object({
  tipoOSId: z.string().uuid('Tipo OS ID inválido'),
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  tipo: z.enum(['SERVICO', 'PRODUTO']),
  preco: z.number().positive('Preço inválido'),
  desconto: z.number().min(0).optional(),
  duracao: z.number().min(0).optional(),
});
