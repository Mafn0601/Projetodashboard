import prisma from '../lib/prisma';
import { supabase } from '../lib/supabase';
import { AppError } from '../middlewares/errorHandler';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

export class EquipeService {
  private sanitizeForLogin(value?: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }

  private async generateUniqueEquipeLogin(email?: string, cpf?: string): Promise<string> {
    const emailPrefix = this.sanitizeForLogin(email?.split('@')[0]);
    const cpfSuffix = String(cpf || '').replace(/\D/g, '').slice(-4);
    const base = emailPrefix || (cpfSuffix ? `eq${cpfSuffix}` : 'equipe');

    let candidate = base;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const exists = await prisma.equipe.findUnique({ where: { login: candidate } });
      if (!exists) {
        return candidate;
      }
      const random = Math.random().toString(36).slice(2, 6);
      candidate = `${base}${random}`;
    }

    return `eq${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  }

  private generateInternalPassword(): string {
    return `Eq!${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }

  async findAll(filters?: {
    search?: string;
    parceiroId?: string;
    funcao?: string;
    ativo?: boolean;
    skip?: number;
    take?: number;
  }) {
    console.time('⏱️ Query Equipe - findMany + count');
    
    const safeSkip =
      typeof filters?.skip === 'number' && Number.isInteger(filters.skip) && filters.skip >= 0
        ? filters.skip
        : 0;

    const safeTake =
      typeof filters?.take === 'number' && Number.isInteger(filters.take) && filters.take >= 0
        ? Math.min(filters.take, 100)
        : 50;

    const where: Prisma.EquipeWhereInput = {};

    if (filters?.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
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
        skip: safeSkip,
        take: safeTake,
        select: {
          id: true,
          nome: true,
          login: true,
          cpf: true,
          funcao: true,
          telefone: true,
          email: true,
          estado: true,
          comissaoAtiva: true,
          agencia: true,
          contaCorrente: true,
          banco: true,
          meioPagamento: true,
          cpfCnpjRecebimento: true,
          tipoComissao: true,
          valorComissao: true,
          ativo: true,
          parceiroId: true,
          parceiro: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.equipe.count({ where }),
    ]);

    console.timeEnd('⏱️ Query Equipe - findMany + count');
    console.log(`📊 Equipes encontradas: ${equipes.length} (total: ${total})`);

    return { equipes, total };
  }

  async findById(id: string) {
    const equipe = await prisma.equipe.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        login: true,
        cpf: true,
        funcao: true,
        telefone: true,
        email: true,
        estado: true,
        comissaoAtiva: true,
        agencia: true,
        contaCorrente: true,
        banco: true,
        meioPagamento: true,
        cpfCnpjRecebimento: true,
        tipoComissao: true,
        valorComissao: true,
        ativo: true,
        parceiroId: true,
        parceiro: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!equipe) {
      throw new AppError('Equipe não encontrada', 404);
    }

    return equipe;
  }

  async create(data: {
    nome: string;
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
    const cpf = data.cpf?.trim();
    const email = data.email?.trim().toLowerCase();

    const loginInterno = await this.generateUniqueEquipeLogin(email, cpf);

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

    // A equipe continua exigindo login/senha no banco, mas esses dados passam a ser internos.
    const senhaHash = await bcrypt.hash(this.generateInternalPassword(), 10);

    const equipe = await prisma.equipe.create({
      data: {
        nome: data.nome.trim(),
        login: loginInterno,
        senha: senhaHash,
        cpf,
        funcao: data.funcao,
        telefone: data.telefone,
        email,
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
      select: {
        id: true,
        nome: true,
        login: true,
        cpf: true,
        funcao: true,
        telefone: true,
        email: true,
        estado: true,
        comissaoAtiva: true,
        agencia: true,
        contaCorrente: true,
        banco: true,
        meioPagamento: true,
        cpfCnpjRecebimento: true,
        tipoComissao: true,
        valorComissao: true,
        ativo: true,
        parceiroId: true,
        parceiro: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return equipe;
  }

  async update(
    id: string,
    data: Partial<{
      nome?: string;
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

    const emailAtualizado = data.email?.trim().toLowerCase();

    const cpfAtualizado = data.cpf?.trim();
    if (cpfAtualizado && cpfAtualizado !== equipe.cpf) {
      const equipeComMesmoCpf = await prisma.equipe.findUnique({
        where: { cpf: cpfAtualizado },
      });

      if (equipeComMesmoCpf) {
        throw new AppError('Já existe uma equipe cadastrada com este CPF', 409);
      }
    }

    const equipeAtualizada = await prisma.equipe.update({
      where: { id },
      data: {
        nome: data.nome?.trim(),
        cpf: cpfAtualizado,
        funcao: data.funcao,
        telefone: data.telefone,
        email: emailAtualizado,
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
      select: {
        id: true,
        nome: true,
        login: true,
        cpf: true,
        funcao: true,
        telefone: true,
        email: true,
        estado: true,
        comissaoAtiva: true,
        agencia: true,
        contaCorrente: true,
        banco: true,
        meioPagamento: true,
        cpfCnpjRecebimento: true,
        tipoComissao: true,
        valorComissao: true,
        ativo: true,
        parceiroId: true,
        parceiro: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        createdAt: true,
        updatedAt: true,
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

    // Deletar também do Supabase
    try {
      await supabase.from('equipes').delete().eq('id', id);
    } catch (error) {
      console.error('Erro ao deletar Equipe do Supabase:', error);
      // Não lança erro se falhar no Supabase
    }

    return { message: 'Equipe deletada com sucesso' };
  }
}

export default new EquipeService();
