import prisma from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import { Prisma } from '@prisma/client';

export class ParceiroService {
  async findAll(filters?: {
    search?: string;
    ativo?: boolean;
    skip?: number;
    take?: number;
  }) {
    console.time('⏱️ Query Parceiro - findMany + count');
    
    const safeSkip =
      typeof filters?.skip === 'number' && Number.isInteger(filters.skip) && filters.skip >= 0
        ? filters.skip
        : 0;

    const safeTake =
      typeof filters?.take === 'number' && Number.isInteger(filters.take) && filters.take >= 0
        ? Math.min(filters.take, 100)
        : 50;

    const where: Prisma.ParceiroWhereInput = {};

    if (filters?.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { cnpj: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { telefone: { contains: filters.search } },
      ];
    }

    if (filters?.ativo !== undefined) {
      where.ativo = filters.ativo;
    }

    const [parceiros, total] = await Promise.all([
      prisma.parceiro.findMany({
        where,
        skip: safeSkip,
        take: safeTake,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.parceiro.count({ where }),
    ]);

    console.timeEnd('⏱️ Query Parceiro - findMany + count');
    console.log(`📊 Parceiros encontrados: ${parceiros.length} (total: ${total})`);

    return { parceiros, total };
  }

  async findById(id: string) {
    const parceiro = await prisma.parceiro.findUnique({ where: { id } });

    if (!parceiro) {
      throw new AppError('Parceiro não encontrado', 404);
    }

    return parceiro;
  }

  async create(data: {
    nome: string;
    cnpj?: string;
    telefone?: string;
    email?: string;
    endereco?: string;
    cep?: string;
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    ativo?: boolean;
  }) {
    const cnpj = data.cnpj?.trim();

    if (cnpj) {
      const parceiroComMesmoCnpj = await prisma.parceiro.findUnique({
        where: { cnpj },
      });

      if (parceiroComMesmoCnpj) {
        throw new AppError('Já existe um parceiro cadastrado com este CNPJ', 409);
      }
    }

    const parceiro = await prisma.parceiro.create({
      data: {
        nome: data.nome,
        cnpj,
        telefone: data.telefone,
        email: data.email,
        endereco: data.endereco,
        cep: data.cep,
        rua: data.rua,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        ativo: data.ativo ?? true,
      },
    });

    return parceiro;
  }

  async update(
    id: string,
    data: Partial<{
      nome: string;
      cnpj?: string;
      telefone?: string;
      email?: string;
      endereco?: string;
      cep?: string;
      rua?: string;
      numero?: string;
      complemento?: string;
      bairro?: string;
      ativo?: boolean;
    }>
  ) {
    const parceiro = await prisma.parceiro.findUnique({ where: { id } });

    if (!parceiro) {
      throw new AppError('Parceiro não encontrado', 404);
    }

    const cnpjAtualizado = data.cnpj?.trim();
    if (cnpjAtualizado && cnpjAtualizado !== parceiro.cnpj) {
      const parceiroComMesmoCnpj = await prisma.parceiro.findUnique({
        where: { cnpj: cnpjAtualizado },
      });

      if (parceiroComMesmoCnpj) {
        throw new AppError('Já existe um parceiro cadastrado com este CNPJ', 409);
      }
    }

    const parceiroAtualizado = await prisma.parceiro.update({
      where: { id },
      data: {
        ...data,
        cnpj: cnpjAtualizado,
      },
    });

    return parceiroAtualizado;
  }

  async delete(id: string) {
    const parceiro = await prisma.parceiro.findUnique({ where: { id } });

    if (!parceiro) {
      throw new AppError('Parceiro não encontrado', 404);
    }

    await prisma.parceiro.delete({ where: { id } });

    return { message: 'Parceiro deletado com sucesso' };
  }
}

export default new ParceiroService();
