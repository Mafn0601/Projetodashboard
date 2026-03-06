import prisma from '../lib/prisma';
import { supabase } from '../lib/supabase';
import { AppError } from '../middlewares/errorHandler';
import { Prisma } from '@prisma/client';

function extractBoxName(observacoes?: string | null): string | null {
  if (!observacoes) return null;
  const match = observacoes.match(/Box:\s*([^|]+)/i);
  if (!match?.[1]) return null;
  const name = match[1].trim();
  return name.length > 0 ? name : null;
}

function getDayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export class AgendamentoService {
  private async validateBoxConflict(params: {
    idToIgnore?: string;
    dataAgendamento: Date;
    horarioAgendamento?: string | null;
    observacoes?: string | null;
  }) {
    const boxNome = extractBoxName(params.observacoes);
    const horario = params.horarioAgendamento?.trim();

    if (!boxNome || !horario) {
      return;
    }

    const { start, end } = getDayRange(params.dataAgendamento);

    const conflito = await prisma.agendamento.findFirst({
      where: {
        id: params.idToIgnore ? { not: params.idToIgnore } : undefined,
        status: { not: 'CANCELADO' },
        horarioAgendamento: horario,
        dataAgendamento: {
          gte: start,
          lt: end,
        },
        observacoes: {
          contains: `Box: ${boxNome}`,
        },
      },
      select: {
        id: true,
        horarioAgendamento: true,
        dataAgendamento: true,
        observacoes: true,
      },
    });

    if (conflito) {
      throw new AppError(`Conflito de agenda: já existe agendamento no box ${boxNome} às ${horario}`, 409);
    }
  }

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
    await this.validateBoxConflict({
      dataAgendamento: data.dataAgendamento as Date,
      horarioAgendamento: (data.horarioAgendamento as string | null) ?? undefined,
      observacoes: (data.observacoes as string | null) ?? undefined,
    });

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

    const nextDataAgendamento =
      data.dataAgendamento instanceof Date
        ? data.dataAgendamento
        : data.dataAgendamento
        ? new Date(data.dataAgendamento as string)
        : exists.dataAgendamento;

    const nextHorario =
      typeof data.horarioAgendamento === 'string'
        ? data.horarioAgendamento
        : exists.horarioAgendamento;

    const nextObservacoes =
      typeof data.observacoes === 'string' ? data.observacoes : exists.observacoes;

    await this.validateBoxConflict({
      idToIgnore: id,
      dataAgendamento: nextDataAgendamento,
      horarioAgendamento: nextHorario ?? undefined,
      observacoes: nextObservacoes ?? undefined,
    });

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

    // Deletar também do Supabase
    try {
      await supabase.from('agendamentos').delete().eq('id', id);
    } catch (error) {
      console.error('Erro ao deletar Agendamento do Supabase:', error);
      // Não lança erro se falhar no Supabase
    }

    return { message: 'Agendamento deletado com sucesso' };
  }
}

export default new AgendamentoService();
