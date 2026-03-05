import prisma from '../lib/prisma';
import { supabase } from '../lib/supabase';
import { AppError } from '../middlewares/errorHandler';
import { Prisma, StatusOS } from '@prisma/client';

export class OrdemServicoService {
  async findAll(filters?: {
    status?: StatusOS;
    clienteId?: string;
    responsavelId?: string;
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

    const where: Prisma.OrdemServicoWhereInput = {};

    if (filters?.status) {
      const allowedStatus: StatusOS[] = [
        'AGUARDANDO',
        'EM_ATENDIMENTO',
        'AGUARDANDO_PECAS',
        'EM_EXECUCAO',
        'CONCLUIDO',
        'ENTREGUE',
      ];

      if (!allowedStatus.includes(filters.status)) {
        throw new AppError('Status de OS inválido', 400);
      }

      where.status = filters.status;
    }

    if (filters?.clienteId) {
      where.clienteId = filters.clienteId;
    }

    if (filters?.responsavelId) {
      where.responsavelId = filters.responsavelId;
    }

    const [ordensServico, total] = await Promise.all([
      prisma.ordemServico.findMany({
        where,
        skip: safeSkip,
        take: safeTake,
        orderBy: { createdAt: 'desc' },
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
          itens: true,
          _count: {
            select: {
              historico: true,
            },
          },
        },
      }),
      prisma.ordemServico.count({ where }),
    ]);

    return { ordensServico, total };
  }

  async findById(id: string) {
    const ordemServico = await prisma.ordemServico.findUnique({
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
        agendamento: true,
        itens: {
          include: {
            tipoItem: true,
          },
        },
        boxOcupacoes: {
          include: {
            box: true,
          },
        },
        historico: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ordemServico) {
      throw new AppError('Ordem de Serviço não encontrada', 404);
    }

    return ordemServico;
  }

  async create(data: any) {
    // Gerar número de OS sequencial
    const lastOS = await prisma.ordemServico.findFirst({
      orderBy: { numeroOS: 'desc' },
    });

    let numeroOS = 'OS0001';
    if (lastOS) {
      const lastNumber = parseInt(lastOS.numeroOS.replace('OS', ''));
      numeroOS = `OS${String(lastNumber + 1).padStart(4, '0')}`;
    }

    const ordemServico = await prisma.ordemServico.create({
      data: {
        ...data,
        numeroOS,
      },
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
      },
    });

    // Registrar histórico
    await prisma.historicoOS.create({
      data: {
        ordemServicoId: ordemServico.id,
        statusNovo: ordemServico.status,
        observacao: 'OS criada',
      },
    });

    return ordemServico;
  }

  async update(id: string, data: any) {
    const exists = await prisma.ordemServico.findUnique({ where: { id } });

    if (!exists) {
      throw new AppError('Ordem de Serviço não encontrada', 404);
    }

    const ordemServico = await prisma.ordemServico.update({
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
        itens: true,
      },
    });

    // Se mudou o status, registrar no histórico
    if (data.status && data.status !== exists.status) {
      await prisma.historicoOS.create({
        data: {
          ordemServicoId: id,
          statusAnterior: exists.status,
          statusNovo: data.status,
          observacao: data.observacaoStatus || `Status alterado para ${data.status}`,
        },
      });
    }

    return ordemServico;
  }

  async updateStatus(id: string, newStatus: StatusOS, observacao?: string) {
    const ordemServico = await prisma.ordemServico.findUnique({ where: { id } });

    if (!ordemServico) {
      throw new AppError('Ordem de Serviço não encontrada', 404);
    }

    const updated = await prisma.ordemServico.update({
      where: { id },
      data: { status: newStatus },
      include: {
        cliente: true,
        veiculo: true,
      },
    });

    // Registrar histórico
    await prisma.historicoOS.create({
      data: {
        ordemServicoId: id,
        statusAnterior: ordemServico.status,
        statusNovo: newStatus,
        observacao,
      },
    });

    return updated;
  }

  async delete(id: string) {
    const exists = await prisma.ordemServico.findUnique({ where: { id } });

    if (!exists) {
      throw new AppError('Ordem de Serviço não encontrada', 404);
    }

    await prisma.ordemServico.delete({ where: { id } });

    // Deletar também do Supabase
    try {
      await supabase.from('ordensServico').delete().eq('id', id);
    } catch (error) {
      console.error('Erro ao deletar Ordem de Serviço do Supabase:', error);
      // Não lança erro se falhar no Supabase
    }

    return { message: 'Ordem de Serviço deletada com sucesso' };
  }

  async getByStatus(groupByStatus: boolean = true) {
    if (!groupByStatus) {
      return this.findAll();
    }

    const ordensServico = await prisma.ordemServico.findMany({
      include: {
        cliente: true,
        veiculo: true,
        responsavel: {
          select: {
            id: true,
            nome: true,
          },
        },
        parceiro: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const grouped = {
      AGUARDANDO: [],
      EM_ATENDIMENTO: [],
      AGUARDANDO_PECAS: [],
      EM_EXECUCAO: [],
      CONCLUIDO: [],
      ENTREGUE: [],
    } as Record<StatusOS, any[]>;

    ordensServico.forEach((os) => {
      grouped[os.status].push(os);
    });

    return grouped;
  }
}

export default new OrdemServicoService();
