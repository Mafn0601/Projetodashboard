import { Prisma, StatusLead } from '@prisma/client';
import prisma from '../lib/prisma';
import { endOfBrasiliaDay, startOfBrasiliaDay } from '../lib/brasiliaTime';
import { AppError } from '../middlewares/errorHandler';

type LeadFilters = {
  search?: string;
  status?: string;
  responsavelId?: string;
  mine?: boolean;
  minScore?: number;
  emSequencia?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  sortBy?: string;
  sortOrder?: string;
  skip?: number;
  take?: number;
};

const ACTIVE_LEAD_STATUSES: StatusLead[] = [
  'NOVO',
  'CONTATO_REALIZADO',
  'QUALIFICADO',
];

function isUuid(value?: string): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export class LeadService {
  private isMaxClientsInSessionModeError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return /MaxClientsInSessionMode|max clients reached/i.test(error.message);
  }

  private async withPrismaRetry<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (!this.isMaxClientsInSessionModeError(error)) {
        throw error;
      }

      // Backoff curto para picos transitórios de conexão no pooler.
      await new Promise((resolve) => setTimeout(resolve, 300));
      return operation();
    }
  }

  private buildWhere(filters?: LeadFilters): Prisma.LeadWhereInput {
    const where: Prisma.LeadWhereInput = {};

    if (filters?.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { telefone: { contains: filters.search } },
        { empresa: { contains: filters.search, mode: 'insensitive' } },
        { cargo: { contains: filters.search, mode: 'insensitive' } },
        { origem: { contains: filters.search, mode: 'insensitive' } },
        { cliente: { nome: { contains: filters.search, mode: 'insensitive' } } },
        { responsavel: { nome: { contains: filters.search, mode: 'insensitive' } } },
        { responsavel: { login: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    if (filters?.status) {
      where.status = filters.status as StatusLead;
    }

    if (filters?.responsavelId) {
      if (isUuid(filters.responsavelId)) {
        where.responsavelId = filters.responsavelId;
      } else {
        console.warn('⚠️ responsavelId inválido no filtro de leads. Retornando vazio para evitar erro Prisma.', {
          responsavelId: filters.responsavelId,
        });
        where.responsavelId = '00000000-0000-0000-0000-000000000000';
      }
    }

    if (filters?.minScore !== undefined) {
      where.score = { gte: filters.minScore };
    }

    if (filters?.emSequencia !== undefined) {
      where.emSequencia = filters.emSequencia;
    }

    if (filters?.createdAfter || filters?.createdBefore) {
      where.createdAt = {
            ...(filters.createdAfter ? { gte: startOfBrasiliaDay(filters.createdAfter) } : {}),
            ...(filters.createdBefore ? { lte: endOfBrasiliaDay(filters.createdBefore) } : {}),
      };
    }

    return where;
  }

  async summary(filters?: LeadFilters) {
    const where = this.buildWhere(filters);

    const [totalLeads, activeLeads, aggregate, statusCounts] = await this.withPrismaRetry(() =>
      prisma.$transaction([
        prisma.lead.count({ where }),
        prisma.lead.count({
          where: {
            ...where,
            status: { in: ACTIVE_LEAD_STATUSES },
          },
        }),
        prisma.lead.aggregate({
          where,
          _avg: {
            score: true,
          },
        }),
        prisma.lead.groupBy({
          by: ['status'],
          where,
          _count: {
            _all: true,
          },
        }),
      ])
    );

    return {
      totalLeads,
      activeLeads,
      averageScore: Math.round(aggregate._avg.score ?? 0),
      statusCounts: statusCounts.map((item) => ({
        status: item.status,
        total: item._count._all,
      })),
    };
  }

  async findAll(filters?: LeadFilters) {
    const safeSkip =
      typeof filters?.skip === 'number' && Number.isInteger(filters.skip) && filters.skip >= 0
        ? filters.skip
        : 0;

    const safeTake =
      typeof filters?.take === 'number' && Number.isInteger(filters.take) && filters.take >= 0
        ? Math.min(filters.take, 100)
        : 50;

    const where = this.buildWhere(filters);
    const allowedSortFields = ['createdAt', 'score', 'ultimaInteracao', 'nome'] as const;
    const orderByField = allowedSortFields.includes(filters?.sortBy as (typeof allowedSortFields)[number])
      ? (filters?.sortBy as (typeof allowedSortFields)[number])
      : 'createdAt';
    const orderByDirection = filters?.sortOrder === 'asc' ? 'asc' : 'desc';

    const [leads, total] = await this.withPrismaRetry(() =>
      prisma.$transaction([
        prisma.lead.findMany({
          where,
          skip: safeSkip,
          take: safeTake,
          orderBy: {
            [orderByField]: orderByDirection,
          },
          include: {
            cliente: {
              select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
              },
            },
            responsavel: {
              select: {
                id: true,
                nome: true,
                login: true,
                email: true,
              },
            },
          },
        }),
        prisma.lead.count({ where }),
      ])
    );

    return { leads, total };
  }

  async findById(id: string) {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        responsavel: {
          select: {
            id: true,
            nome: true,
            login: true,
            email: true,
          },
        },
      },
    });

    if (!lead) {
      throw new AppError('Lead não encontrado', 404);
    }

    return lead;
  }

  async create(data: Prisma.LeadUncheckedCreateInput) {
    return prisma.lead.create({
      data,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        responsavel: {
          select: {
            id: true,
            nome: true,
            login: true,
            email: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Prisma.LeadUncheckedUpdateInput) {
    const exists = await prisma.lead.findUnique({ where: { id } });

    if (!exists) {
      throw new AppError('Lead não encontrado', 404);
    }

    return prisma.lead.update({
      where: { id },
      data,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        responsavel: {
          select: {
            id: true,
            nome: true,
            login: true,
            email: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    const exists = await prisma.lead.findUnique({ where: { id } });

    if (!exists) {
      throw new AppError('Lead não encontrado', 404);
    }

    await prisma.lead.delete({ where: { id } });

    return { message: 'Lead deletado com sucesso' };
  }
}

export default new LeadService();