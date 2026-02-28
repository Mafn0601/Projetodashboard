import prisma from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import { Prisma } from '@prisma/client';

export class ClienteService {
  async findAll(filters?: {
    search?: string;
    ativo?: boolean;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.ClienteWhereInput = {};

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
        skip: filters?.skip || 0,
        take: filters?.take || 50,
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

    // Soft delete
    await prisma.cliente.update({
      where: { id },
      data: { ativo: false },
    });

    return { message: 'Cliente desativado com sucesso' };
  }
}

export default new ClienteService();
