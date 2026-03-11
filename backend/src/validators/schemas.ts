import { z } from 'zod';

const optionalText = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    if (Array.isArray(value)) {
      return value[0];
    }

    return value;
  });

const optionalNonNegativeInt = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    const raw = Array.isArray(value) ? value[0] : value;

    if (raw === undefined || raw === '') {
      return undefined;
    }

    const parsed = Number(raw);

    if (!Number.isInteger(parsed) || parsed < 0) {
      return NaN;
    }

    return parsed;
  })
  .refine((value) => value === undefined || Number.isInteger(value), {
    message: 'Deve ser um número inteiro',
  })
  .refine((value) => value === undefined || value >= 0, {
    message: 'Deve ser maior ou igual a zero',
  });

const optionalBooleanString = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    const raw = Array.isArray(value) ? value[0] : value;

    if (raw === undefined || raw === '') {
      return undefined;
    }

    if (raw === 'true') {
      return true;
    }

    if (raw === 'false') {
      return false;
    }

    return null;
  })
  .refine((value) => value === undefined || typeof value === 'boolean', {
    message: 'Deve ser true ou false',
  });

const optionalUuid = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    const raw = Array.isArray(value) ? value[0] : value;

    if (raw === undefined || raw === '') {
      return undefined;
    }

    return raw;
  })
  .refine(
    (value) =>
      value === undefined ||
      z.string().uuid().safeParse(value).success,
    {
      message: 'UUID inválido',
    }
  );

const optionalDateString = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    const raw = Array.isArray(value) ? value[0] : value;

    if (raw === undefined || raw === '') {
      return undefined;
    }

    return raw;
  })
  .refine(
    (value) =>
      value === undefined ||
      (typeof value === 'string' && !Number.isNaN(new Date(value).getTime())),
    {
      message: 'Data inválida',
    }
  );

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

export const changePasswordSchema = z
  .object({
    senhaAtual: z.string().min(6, 'Senha atual inválida'),
    novaSenha: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
    confirmarNovaSenha: z.string().min(6, 'Confirmação de senha inválida'),
  })
  .refine((data) => data.novaSenha === data.confirmarNovaSenha, {
    message: 'Confirmação de senha não confere',
    path: ['confirmarNovaSenha'],
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

export const clienteParamsSchema = z.object({
  id: z.string().uuid('ID de cliente inválido'),
});

export const clienteListQuerySchema = z
  .object({
    search: optionalText,
    ativo: optionalBooleanString,
    skip: optionalNonNegativeInt,
    take: optionalNonNegativeInt,
  })
  .transform((query) => ({
    ...query,
    take: query.take !== undefined ? Math.min(query.take, 100) : undefined,
  }));

export const veiculoListQuerySchema = z
  .object({
    clienteId: optionalUuid,
    placa: optionalText,
    search: optionalText,
    skip: optionalNonNegativeInt,
    take: optionalNonNegativeInt,
  })
  .transform((query) => ({
    ...query,
    take: query.take !== undefined ? Math.min(query.take, 100) : undefined,
  }));

export const veiculoParamsSchema = z.object({
  id: z.string().uuid('ID de veículo inválido'),
});

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
  tipoOSId: z.string().uuid('Tipo OS ID inválido').optional(),
  itemOSId: z.string().uuid('Item OS ID inválido').optional(),
  dataAgendamento: z.string().datetime('Data inválida'),
  horarioAgendamento: z.string().optional(),
  tipoAgendamento: z.string().min(3, 'Tipo de agendamento inválido'),
  descricaoServico: z.string().optional(),
  observacoes: z.string().optional(),
  quilometragem: z.string().optional(),
  duracao: z.number().int().positive().optional(),
});

export const updateAgendamentoSchema = createAgendamentoSchema.partial().extend({
  status: z.enum(['CONFIRMADO', 'EXECUTANDO', 'FINALIZADO', 'CANCELADO']).optional(),
});

export const agendamentoListQuerySchema = z
  .object({
    status: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((value) => (Array.isArray(value) ? value[0] : value))
      .refine(
        (value) =>
          value === undefined ||
          z
            .enum(['CONFIRMADO', 'EXECUTANDO', 'FINALIZADO', 'CANCELADO'])
            .safeParse(value).success,
        { message: 'Status inválido' }
      ),
    clienteId: optionalUuid,
    responsavelId: optionalUuid,
    parceiroId: optionalUuid,
    dataInicio: optionalDateString,
    dataFim: optionalDateString,
    skip: optionalNonNegativeInt,
    take: optionalNonNegativeInt,
  })
  .transform((query) => ({
    ...query,
    take: query.take !== undefined ? Math.min(query.take, 100) : undefined,
  }));

export const agendamentoParamsSchema = z.object({
  id: z.string().uuid('ID de agendamento inválido'),
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

export const ordemServicoListQuerySchema = z
  .object({
    status: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((value) => (Array.isArray(value) ? value[0] : value))
      .refine(
        (value) =>
          value === undefined ||
          z
            .enum(['AGUARDANDO', 'EM_ATENDIMENTO', 'AGUARDANDO_PECAS', 'EM_EXECUCAO', 'CONCLUIDO', 'ENTREGUE'])
            .safeParse(value).success,
        { message: 'Status inválido' }
      ),
    clienteId: optionalUuid,
    responsavelId: optionalUuid,
    skip: optionalNonNegativeInt,
    take: optionalNonNegativeInt,
    groupByStatus: optionalBooleanString,
  })
  .transform((query) => ({
    ...query,
    take: query.take !== undefined ? Math.min(query.take, 100) : undefined,
  }));

export const ordemServicoParamsSchema = z.object({
  id: z.string().uuid('ID de ordem de serviço inválido'),
});

export const updateOrdemServicoStatusSchema = z.object({
  status: z.enum(['AGUARDANDO', 'EM_ATENDIMENTO', 'AGUARDANDO_PECAS', 'EM_EXECUCAO', 'CONCLUIDO', 'ENTREGUE']),
  observacao: z.string().optional(),
});

// ==================== ORÇAMENTO ====================

export const createOrcamentoItemSchema = z.object({
  descricao: z.string().min(1, 'Descrição do item é obrigatória'),
  quantidade: z.number().int().positive('Quantidade inválida').default(1),
  valorUnitario: z.number().nonnegative('Valor unitário inválido'),
  valorTotal: z.number().nonnegative('Valor total inválido'),
});

export const createOrcamentoSchema = z.object({
  clienteId: z.string().uuid('Cliente ID inválido'),
  descricao: z.string().optional(),
  valorTotal: z.number().nonnegative('Valor total inválido'),
  desconto: z.number().nonnegative('Desconto inválido').optional(),
  validade: z.string().datetime('Data de validade inválida'),
  status: z.enum(['PENDENTE', 'APROVADO', 'REJEITADO', 'EXPIRADO']).optional(),
  observacoes: z.string().optional(),
  itens: z.array(createOrcamentoItemSchema).optional(),
});

export const orcamentoListQuerySchema = z
  .object({
    status: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((value) => (Array.isArray(value) ? value[0] : value))
      .refine(
        (value) =>
          value === undefined ||
          z.enum(['PENDENTE', 'APROVADO', 'REJEITADO', 'EXPIRADO']).safeParse(value).success,
        { message: 'Status inválido' }
      ),
    clienteId: optionalUuid,
    skip: optionalNonNegativeInt,
    take: optionalNonNegativeInt,
  })
  .transform((query) => ({
    ...query,
    take: query.take !== undefined ? Math.min(query.take, 100) : undefined,
  }));

export const orcamentoParamsSchema = z.object({
  id: z.string().uuid('ID de orçamento inválido'),
});

// ==================== PARCEIRO ====================

export const createParceiroSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  endereco: z.string().optional(),
  cep: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  ativo: z.boolean().optional(),
});

export const updateParceiroSchema = createParceiroSchema.partial();

export const parceiroListQuerySchema = z
  .object({
    search: optionalText,
    ativo: optionalBooleanString,
    skip: optionalNonNegativeInt,
    take: optionalNonNegativeInt,
  })
  .transform((query) => ({
    ...query,
    take: query.take !== undefined ? Math.min(query.take, 100) : undefined,
  }));

export const parceiroParamsSchema = z.object({
  id: z.string().uuid('ID de parceiro inválido'),
});

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
// ==================== EQUIPE ====================

export const createEquipeSchema = z.object({
  login: z.string().min(3, 'Login deve ter no mínimo 3 caracteres'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').refine(
    (val) => val.trim().length > 0,
    'Senha não pode estar vazia'
  ),
  cpf: z.string().min(1, 'CPF é obrigatório').regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  funcao: z.string().min(3, 'Função é inválida'),
  email: z.string().email('Email inválido'),
  estado: z.string().optional(),
  telefone: z.string().optional(),
  comissaoAtiva: z.boolean().optional(),
  agencia: z.string().optional(),
  contaCorrente: z.string().optional(),
  banco: z.string().optional(),
  meioPagamento: z.string().optional(),
  cpfCnpjRecebimento: z.string().optional(),
  tipoComissao: z.string().optional(),
  valorComissao: z.string().optional(),
  parceiroId: z.string().uuid('Parceiro ID inválido'),
  ativo: z.boolean().optional(),
});

export const updateEquipeSchema = createEquipeSchema.partial().omit({ parceiroId: true });

export const equipeListQuerySchema = z
  .object({
    search: optionalText,
    parceiroId: optionalUuid,
    funcao: optionalText,
    ativo: optionalBooleanString,
    skip: optionalNonNegativeInt,
    take: optionalNonNegativeInt,
  })
  .transform((query) => ({
    ...query,
    take: query.take !== undefined ? Math.min(query.take, 100) : undefined,
  }));

export const equipeParamsSchema = z.object({
  id: z.string().uuid('ID de equipe inválido'),
});

export const createChamadoSchema = z.object({
  email: z.string().email('Email inválido'),
  assunto: z.string().min(3, 'Assunto deve ter no mínimo 3 caracteres'),
  urgencia: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA']),
  descricao: z.string().min(5, 'Descrição deve ter no mínimo 5 caracteres'),
});

export const chamadoParamsSchema = z.object({
  id: z.string().uuid('ID de chamado inválido'),
});

export const updateChamadoStatusSchema = z.object({
  status: z.enum(['ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO', 'FECHADO']),
});