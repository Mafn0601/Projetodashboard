import prisma from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import { Prisma } from '@prisma/client';
import { supabase } from '../lib/supabase';

export class ClienteService {
  async findAll(filters?: {
    search?: string;
    ativo?: boolean;
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
        : 50;

    const where: Prisma.ClienteWhereInput = {};

    // FIXME: implementar full-text search em produção
    if (filters?.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { telefone: { contains: filters.search } },
        { cpfCnpj: { contains: filters.search } },
      ];
    }

    if (filters?.ativo !== undefined) {
      where.ativo = filters.ativo;
    }

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip: safeSkip,
        take: safeTake,
        orderBy: { createdAt: 'desc' },
        include: {
          veiculos: true,
          _count: {
            select: {
              agendamentos: true,
              ordensServico: true,
            },
          },
        },
      }),
      prisma.cliente.count({ where }),
    ]);

    return { clientes, total };
  }

  async findById(id: string) {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        veiculos: true,
        agendamentos: {
          orderBy: { dataAgendamento: 'desc' },
          take: 10,
        },
        ordensServico: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!cliente) {
      throw new AppError('Cliente não encontrado', 404);
    }

    return cliente;
  }

  async create(data: Prisma.ClienteCreateInput) {
    // Verificar se CPF/CNPJ já existe
    if (data.cpfCnpj) {
      const exists = await prisma.cliente.findUnique({
        where: { cpfCnpj: data.cpfCnpj },
      });

      if (exists) {
        throw new AppError('CPF/CNPJ já cadastrado', 400);
      }
    }

    const cliente = await prisma.cliente.create({
      data,
      include: {
        veiculos: true,
      },
    });

    return cliente;
  }

  async update(id: string, data: Prisma.ClienteUpdateInput) {
    const exists = await prisma.cliente.findUnique({ where: { id } });

    if (!exists) {
      throw new AppError('Cliente não encontrado', 404);
    }

    // Verificar se CPF/CNPJ já existe em outro cliente
    if (data.cpfCnpj && typeof data.cpfCnpj === 'string') {
      const duplicate = await prisma.cliente.findFirst({
        where: {
          cpfCnpj: data.cpfCnpj,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new AppError('CPF/CNPJ já cadastrado para outro cliente', 400);
      }
    }

    const cliente = await prisma.cliente.update({
      where: { id },
      data,
      include: {
        veiculos: true,
      },
    });

    return cliente;
  }

  async delete(id: string) {
    const exists = await prisma.cliente.findUnique({ where: { id } });

    if (!exists) {
      throw new AppError('Cliente não encontrado', 404);
    }

    // Hard delete - remove permanentemente do banco de dados
    await prisma.cliente.delete({
      where: { id },
    });

    // Deletar do Supabase também
    try {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) {
        console.error('Erro ao deletar cliente do Supabase:', error);
      }
    } catch (error) {
      console.error('Erro ao deletar cliente do Supabase:', error);
    }

    return { message: 'Cliente deletado permanentemente com sucesso' };
  }
}

export default new ClienteService();
