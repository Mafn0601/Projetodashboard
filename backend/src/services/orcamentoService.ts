import prisma from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import { Prisma, StatusOrcamento } from '@prisma/client';

export class OrcamentoService {
  async findAll(filters?: {
    status?: string;
    clienteId?: string;
    skip?: number;
    take?: number;
  }) {
    const safeSkip =
      typeof filters?.skip === 'number' && Number.isInteger(filters.skip) && filters.skip >= 0
        ? filters.skip
        : 0;

    const safeTake =
      typeof filters?.take === 'number' && Number.isInteger(filters.take) && filters.take >= 0
        ? Math.min(filters.take, 100)
        : 100;

    const where: Prisma.OrcamentoWhereInput = {};

    if (filters?.status) {
      const allowedStatus: StatusOrcamento[] = ['PENDENTE', 'APROVADO', 'REJEITADO', 'EXPIRADO'];
      if (!allowedStatus.includes(filters.status as StatusOrcamento)) {
        throw new AppError('Status de orçamento inválido', 400);
      }
      where.status = filters.status as StatusOrcamento;
    }

    if (filters?.clienteId) {
      where.clienteId = filters.clienteId;
    }

    const [orcamentos, total] = await Promise.all([
      prisma.orcamento.findMany({
        where,
        skip: safeSkip,
        take: safeTake,
        orderBy: { createdAt: 'desc' },
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              telefone: true,
              email: true,
            },
          },
          itens: true,
          _count: {
            select: {
              itens: true,
            },
          },
        },
      }),
      prisma.orcamento.count({ where }),
    ]);

    return { orcamentos, total };
  }

  async findById(id: string) {
    const orcamento = await prisma.orcamento.findUnique({
      where: { id },
      include: {
        cliente: true,
        itens: true,
      },
    });

    if (!orcamento) {
      throw new AppError('Orçamento não encontrado', 404);
    }

    return orcamento;
  }

  async create(data: {
    clienteId: string;
    descricao?: string;
    valorTotal: number;
    desconto?: number;
    validade: string;
    status?: StatusOrcamento;
    observacoes?: string;
    itens?: Array<{
      descricao: string;
      quantidade: number;
      valorUnitario: number;
      valorTotal: number;
    }>;
  }) {
    const cliente = await prisma.cliente.findUnique({ where: { id: data.clienteId } });
    if (!cliente) {
      throw new AppError('Cliente não encontrado para o orçamento', 404);
    }

    const lastOrcamento = await prisma.orcamento.findFirst({
      orderBy: { numeroOrcamento: 'desc' },
    });

    let numeroOrcamento = 'ORC0001';
    if (lastOrcamento?.numeroOrcamento) {
      const lastNumber = parseInt(lastOrcamento.numeroOrcamento.replace('ORC', ''), 10);
      if (!Number.isNaN(lastNumber)) {
        numeroOrcamento = `ORC${String(lastNumber + 1).padStart(4, '0')}`;
      }
    }

    const orcamento = await prisma.orcamento.create({
      data: {
        numeroOrcamento,
        cliente: { connect: { id: data.clienteId } },
        descricao: data.descricao,
        valorTotal: data.valorTotal,
        desconto: data.desconto ?? 0,
        validade: new Date(data.validade),
        status: data.status ?? 'PENDENTE',
        observacoes: data.observacoes,
        itens: data.itens?.length
          ? {
              create: data.itens.map((item) => ({
                descricao: item.descricao,
                quantidade: item.quantidade,
                valorUnitario: item.valorUnitario,
                valorTotal: item.valorTotal,
              })),
            }
          : undefined,
      },
      include: {
        cliente: true,
        itens: true,
      },
    });

    return orcamento;
  }
}

export default new OrcamentoService();
