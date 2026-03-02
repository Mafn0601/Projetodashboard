import prisma from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

export class EquipeService {
  async findAll(filters?: {
    search?: string;
    parceiroId?: string;
    funcao?: string;
    ativo?: boolean;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.EquipeWhereInput = {};

    if (filters?.search) {
      where.OR = [
        { login: { contains: filters.search, mode: 'insensitive' } },
        { cpf: { contains: filters.search } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { telefone: { contains: filters.search } },
      ];
    }

    if (filters?.parceiroId) {
      where.parceiroId = filters.parceiroId;
    }

    if (filters?.funcao) {
      where.funcao = filters.funcao;
    }

    if (filters?.ativo !== undefined) {
      where.ativo = filters.ativo;
    }

    const [equipes, total] = await Promise.all([
      prisma.equipe.findMany({
        where,
        skip: filters?.skip || 0,
        take: filters?.take || 50,
        include: {
          parceiro: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.equipe.count({ where }),
    ]);

    return { equipes, total };
  }

  async findById(id: string) {
    const equipe = await prisma.equipe.findUnique({
      where: { id },
      include: {
        parceiro: true,
      },
    });

    if (!equipe) {
      throw new AppError('Equipe não encontrada', 404);
    }

    return equipe;
  }

  async create(data: {
    login: string;
    senha: string;
    cpf?: string;
    funcao: string;
    telefone?: string;
    email?: string;
    estado?: string;
    comissaoAtiva?: boolean;
    agencia?: string;
    contaCorrente?: string;
    banco?: string;
    meioPagamento?: string;
    cpfCnpjRecebimento?: string;
    tipoComissao?: string;
    valorComissao?: string;
    parceiroId: string;
    ativo?: boolean;
  }) {
    const login = data.login?.trim().toLowerCase();
    const cpf = data.cpf?.trim();

    // Verificar se login já existe
    const equipeComMesmoLogin = await prisma.equipe.findUnique({
      where: { login },
    });

    if (equipeComMesmoLogin) {
      throw new AppError('Já existe uma equipe cadastrada com este login', 409);
    }

    // Verificar se CPF já existe
    if (cpf) {
      const equipeComMesmoCpf = await prisma.equipe.findUnique({
        where: { cpf },
      });

      if (equipeComMesmoCpf) {
        throw new AppError('Já existe uma equipe cadastrada com este CPF', 409);
      }
    }

    // Verificar se parceiro existe
    const parceiroExiste = await prisma.parceiro.findUnique({
      where: { id: data.parceiroId },
    });

    if (!parceiroExiste) {
      throw new AppError('Parceiro não encontrado', 404);
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(data.senha, 10);

    const equipe = await prisma.equipe.create({
      data: {
        login,
        senha: senhaHash,
        cpf,
        funcao: data.funcao,
        telefone: data.telefone,
        email: data.email,
        estado: data.estado,
        comissaoAtiva: data.comissaoAtiva ?? false,
        agencia: data.agencia,
        contaCorrente: data.contaCorrente,
        banco: data.banco,
        meioPagamento: data.meioPagamento,
        cpfCnpjRecebimento: data.cpfCnpjRecebimento,
        tipoComissao: data.tipoComissao,
        valorComissao: data.valorComissao,
        parceiroId: data.parceiroId,
        ativo: data.ativo ?? true,
      },
      include: {
        parceiro: true,
      },
    });

    return equipe;
  }

  async update(
    id: string,
    data: Partial<{
      login: string;
      senha: string;
      cpf?: string;
      funcao: string;
      telefone?: string;
      email?: string;
      estado?: string;
      comissaoAtiva?: boolean;
      agencia?: string;
      contaCorrente?: string;
      banco?: string;
      meioPagamento?: string;
      cpfCnpjRecebimento?: string;
      tipoComissao?: string;
      valorComissao?: string;
      ativo?: boolean;
    }>
  ) {
    const equipe = await prisma.equipe.findUnique({ where: { id } });

    if (!equipe) {
      throw new AppError('Equipe não encontrada', 404);
    }

    const loginAtualizado = data.login?.trim().toLowerCase();
    if (loginAtualizado && loginAtualizado !== equipe.login) {
      const equipeComMesmoLogin = await prisma.equipe.findUnique({
        where: { login: loginAtualizado },
      });

      if (equipeComMesmoLogin) {
        throw new AppError('Já existe uma equipe cadastrada com este login', 409);
      }
    }

    const cpfAtualizado = data.cpf?.trim();
    if (cpfAtualizado && cpfAtualizado !== equipe.cpf) {
      const equipeComMesmoCpf = await prisma.equipe.findUnique({
        where: { cpf: cpfAtualizado },
      });

      if (equipeComMesmoCpf) {
        throw new AppError('Já existe uma equipe cadastrada com este CPF', 409);
      }
    }

    // Hash da senha se fornecida
    let senhaHash: string | undefined;
    if (data.senha) {
      senhaHash = await bcrypt.hash(data.senha, 10);
    }

    const equipeAtualizada = await prisma.equipe.update({
      where: { id },
      data: {
        login: loginAtualizado,
        ...(senhaHash && { senha: senhaHash }),
        cpf: cpfAtualizado,
        funcao: data.funcao,
        telefone: data.telefone,
        email: data.email,
        estado: data.estado,
        comissaoAtiva: data.comissaoAtiva,
        agencia: data.agencia,
        contaCorrente: data.contaCorrente,
        banco: data.banco,
        meioPagamento: data.meioPagamento,
        cpfCnpjRecebimento: data.cpfCnpjRecebimento,
        tipoComissao: data.tipoComissao,
        valorComissao: data.valorComissao,
        ativo: data.ativo,
      },
      include: {
        parceiro: true,
      },
    });

    return equipeAtualizada;
  }

  async delete(id: string) {
    const equipe = await prisma.equipe.findUnique({ where: { id } });

    if (!equipe) {
      throw new AppError('Equipe não encontrada', 404);
    }

    await prisma.equipe.delete({ where: { id } });

    return { message: 'Equipe deletada com sucesso' };
  }
}

export default new EquipeService();
