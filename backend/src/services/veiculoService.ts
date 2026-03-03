import prisma from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import { Prisma } from '@prisma/client';

export class VeiculoService {
  async findAll(filters?: {
    clienteId?: string;
    placa?: string;
    search?: string;
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

    const where: Prisma.VeiculoWhereInput = {};

    if (filters?.clienteId) {
      where.clienteId = filters.clienteId;
    }

    if (filters?.placa) {
      where.placa = {
        contains: filters.placa,
        mode: 'insensitive',
      };
    }

    if (filters?.search) {
      where.OR = [
        { modelo: { contains: filters.search, mode: 'insensitive' } },
        { marca: { contains: filters.search, mode: 'insensitive' } },
        { placa: { contains: filters.search, mode: 'insensitive' } },
        { chassi: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [veiculos, total] = await Promise.all([
      prisma.veiculo.findMany({
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
            },
          },
        },
      }),
      prisma.veiculo.count({ where }),
    ]);

    return { veiculos, total };
  }

  async findById(id: string) {
    const veiculo = await prisma.veiculo.findUnique({
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
        agendamentos: {
          select: {
            id: true,
            dataAgendamento: true,
            status: true,
          },
          orderBy: { dataAgendamento: 'desc' },
          take: 5,
        },
        ordensServico: {
          select: {
            id: true,
            numeroOS: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!veiculo) {
      throw new AppError('Veículo não encontrado', 404);
    }

    return veiculo;
  }

  async create(data: {
    clienteId: string;
    placa: string;
    chassi?: string;
    marca: string;
    modelo: string;
    fabricante?: string;
    anoFabricacao?: string;
    anoModelo?: string;
    cor?: string;
    combustivel?: string;
  }) {
    // Validar cliente
    const clienteExists = await prisma.cliente.findUnique({
      where: { id: data.clienteId },
    });

    if (!clienteExists) {
      throw new AppError('Cliente não encontrado', 404);
    }

    // Verificar se placa já existe
    const placaExists = await prisma.veiculo.findUnique({
      where: { placa: data.placa },
    });

    if (placaExists) {
      throw new AppError('Veículo com esta placa já está cadastrado', 400);
    }

    const veiculo = await prisma.veiculo.create({
      data: {
        clienteId: data.clienteId,
        placa: data.placa.toUpperCase(),
        chassi: data.chassi,
        marca: data.marca,
        modelo: data.modelo,
        fabricante: data.fabricante,
        anoFabricacao: data.anoFabricacao,
        anoModelo: data.anoModelo,
        cor: data.cor,
        combustivel: data.combustivel,
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
      },
    });

    return veiculo;
  }

  async update(
    id: string,
    data: Partial<{
      placa?: string;
      chassi?: string;
      marca?: string;
      modelo?: string;
      fabricante?: string;
      anoFabricacao?: string;
      anoModelo?: string;
      cor?: string;
      combustivel?: string;
    }>
  ) {
    const veiculo = await prisma.veiculo.findUnique({
      where: { id },
    });

    if (!veiculo) {
      throw new AppError('Veículo não encontrado', 404);
    }

    // Se está atualizando a placa, verificar se já existe outra
    if (data.placa && data.placa !== veiculo.placa) {
      const placaExists = await prisma.veiculo.findUnique({
        where: { placa: data.placa },
      });

      if (placaExists) {
        throw new AppError('Veículo com esta placa já está cadastrado', 400);
      }
    }

    const veiculoAtualizado = await prisma.veiculo.update({
      where: { id },
      data: {
        placa: data.placa ? data.placa.toUpperCase() : undefined,
        chassi: data.chassi,
        marca: data.marca,
        modelo: data.modelo,
        fabricante: data.fabricante,
        anoFabricacao: data.anoFabricacao,
        anoModelo: data.anoModelo,
        cor: data.cor,
        combustivel: data.combustivel,
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
      },
    });

    return veiculoAtualizado;
  }

  async delete(id: string) {
    const veiculo = await prisma.veiculo.findUnique({
      where: { id },
    });

    if (!veiculo) {
      throw new AppError('Veículo não encontrado', 404);
    }

    // Verificar se tem agendamentos ou ordens associadas
    const [agendamentosCount, ordensCount] = await Promise.all([
      prisma.agendamento.count({ where: { veiculoId: id } }),
      prisma.ordemServico.count({ where: { veiculoId: id } }),
    ]);

    if (agendamentosCount > 0 || ordensCount > 0) {
      throw new AppError(
        'Não é possível deletar veículo com agendamentos ou ordens de serviço associados',
        400
      );
    }

    await prisma.veiculo.delete({
      where: { id },
    });

    return { message: 'Veículo deletado com sucesso' };
  }
}

export default new VeiculoService();
