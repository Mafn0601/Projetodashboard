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
    const safeSkip =
      typeof filters?.skip === 'number' && Number.isInteger(filters.skip) && filters.skip >= 0
        ? filters.skip
        : 0;

    const safeTake =
      typeof filters?.take === 'number' && Number.isInteger(filters.take) && filters.take >= 0
        ? Math.min(filters.take, 100)
        : 100;

    const where: Prisma.AgendamentoWhereInput = {};

    if (filters?.status) {
      const allowedStatus = ['CONFIRMADO', 'EXECUTANDO', 'FINALIZADO', 'CANCELADO'];

      if (!allowedStatus.includes(filters.status)) {
        throw new AppError('Status de agendamento inválido', 400);
      }

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
        const dataInicio = new Date(filters.dataInicio);

        if (Number.isNaN(dataInicio.getTime())) {
          throw new AppError('Data inicial inválida', 400);
        }

        where.dataAgendamento.gte = dataInicio;
      }
      if (filters.dataFim) {
        const dataFim = new Date(filters.dataFim);

        if (Number.isNaN(dataFim.getTime())) {
          throw new AppError('Data final inválida', 400);
        }

        where.dataAgendamento.lte = dataFim;
      }
    }

    const [agendamentos, total] = await Promise.all([
      prisma.agendamento.findMany({
        where,
        skip: safeSkip,
        take: safeTake,
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
