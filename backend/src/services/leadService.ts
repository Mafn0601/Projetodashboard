import { Prisma, StatusLead } from '@prisma/client';
import prisma from '../lib/prisma';
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

export class LeadService {
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
      where.responsavelId = filters.responsavelId;
    }

    if (filters?.minScore !== undefined) {
      where.score = { gte: filters.minScore };
    }

    if (filters?.emSequencia !== undefined) {
      where.emSequencia = filters.emSequencia;
    }

    if (filters?.createdAfter || filters?.createdBefore) {
      where.createdAt = {
        ...(filters.createdAfter ? { gte: new Date(filters.createdAfter) } : {}),
        ...(filters.createdBefore ? { lte: new Date(filters.createdBefore) } : {}),
      };
    }

    return where;
  }

  async summary(filters?: LeadFilters) {
    const where = this.buildWhere(filters);

    const [totalLeads, activeLeads, aggregate, statusCounts] = await Promise.all([
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
    ]);

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

    const [leads, total] = await Promise.all([
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
    ]);

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