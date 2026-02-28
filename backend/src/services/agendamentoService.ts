import prisma from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import { Prisma } from '@prisma/client';

export class AgendamentoService {
  async findAll(filters?: {
    status?: string;
    clienteId?: string;
    responsavelId?: string;
    dataInicio?: string;
    dataFim?: string;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.AgendamentoWhereInput = {};

    if (filters?.status) {
      where.status = filters.status as any;
    }

    if (filters?.clienteId) {
      where.clienteId = filters.clienteId;
    }

    if (filters?.responsavelId) {
      where.responsavelId = filters.responsavelId;
    }

    if (filters?.dataInicio || filters?.dataFim) {
      where.dataAgendamento = {};
      if (filters.dataInicio) {
        where.dataAgendamento.gte = new Date(filters.dataInicio);
      }
      if (filters.dataFim) {
        where.dataAgendamento.lte = new Date(filters.dataFim);
      }
    }

    const [agendamentos, total] = await Promise.all([
      prisma.agendamento.findMany({
        where,
        skip: filters?.skip || 0,
        take: filters?.take || 100,
        orderBy: { dataAgendamento: 'asc' },
        include: {
          cliente: true,
          veiculo: true,
          responsavel: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          parceiro: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      }),
      prisma.agendamento.count({ where }),
    ]);

    return { agendamentos, total };
  }

  async findById(id: string) {
    const agendamento = await prisma.agendamento.findUnique({
      where: { id },
      include: {
        cliente: true,
        veiculo: true,
        responsavel: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        parceiro: {
          select: {
            id: true,
            nome: true,
          },
        },
        ordemServico: true,
      },
    });

    if (!agendamento) {
      throw new AppError('Agendamento não encontrado', 404);
    }

    return agendamento;
  }

  async create(data: Prisma.AgendamentoCreateInput) {
    const agendamento = await prisma.agendamento.create({
      data,
      include: {
        cliente: true,
        veiculo: true,
        responsavel: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        parceiro: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    return agendamento;
  }

  async update(id: string, data: Prisma.AgendamentoUpdateInput) {
    const exists = await prisma.agendamento.findUnique({ where: { id } });

    if (!exists) {
      throw new AppError('Agendamento não encontrado', 404);
    }

    const agendamento = await prisma.agendamento.update({
      where: { id },
      data,
      include: {
        cliente: true,
        veiculo: true,
        responsavel: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        parceiro: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    return agendamento;
  }

  async delete(id: string) {
    const exists = await prisma.agendamento.findUnique({ where: { id } });

    if (!exists) {
      throw new AppError('Agendamento não encontrado', 404);
    }

    await prisma.agendamento.delete({ where: { id } });

    return { message: 'Agendamento deletado com sucesso' };
  }
}

export default new AgendamentoService();
