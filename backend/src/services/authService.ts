import prisma from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middlewares/errorHandler';

export class AuthService {
  async register(data: {
    nome: string;
    login: string;
    email: string;
    senha: string;
    role?: 'ADMIN' | 'GERENTE' | 'OPERADOR' | 'PARCEIRO';
  }) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const normalizedLogin = data.login.trim().toLowerCase();

    // verifica se já tem alguém com esse email
    const emailExists = await prisma.usuario.findUnique({
      where: { email: normalizedEmail },
    });

    if (emailExists) {
      throw new AppError('Email já cadastrado', 400);
    }

    // verifica o login também
    const loginExists = await prisma.usuario.findUnique({
      where: { login: normalizedLogin },
    });

    if (loginExists) {
      throw new AppError('Login já cadastrado', 400);
    }

    const senhaHash = await hashPassword(data.senha);

    // cria o usuário novo no banco
    const usuario = await prisma.usuario.create({
      data: {
        ...data,
        email: normalizedEmail,
        login: normalizedLogin,
        senha: senhaHash,
        role: data.role || 'OPERADOR',
      },
      select: {
        id: true,
        nome: true,
        login: true,
        email: true,
        role: true,
        ativo: true,
        createdAt: true,
      },
    });

    const token = generateToken({
      userId: usuario.id,
      email: usuario.email,
      role: usuario.role,
    });

    return { usuario, token };
  }

  async login(email: string, senha: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const usuario = await prisma.usuario.findUnique({
      where: { email: normalizedEmail },
    });

    if (!usuario) {
      throw new AppError('Credenciais inválidas', 401);
    }

    // checa se o usuário tá ativo ainda
    if (!usuario.ativo) {
      throw new AppError('Usuário inativo', 401);
    }

    // compara a senha fornecida com o hash do banco
    const senhaValida = await comparePassword(senha, usuario.senha);

    if (!senhaValida) {
      throw new AppError('Credenciais inválidas', 401);
    }

    const token = generateToken({
      userId: usuario.id,
      email: usuario.email,
      role: usuario.role,
    });

    // TODO: adicionar refresh token no futuro
    return {
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        login: usuario.login,
        email: usuario.email,
        role: usuario.role,
      },
      token,
    };
  }

  async getMe(userId: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        login: true,
        email: true,
        role: true,
        ativo: true,
        parceiro: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!usuario) {
      throw new AppError('Usuário não encontrado', 404);
    }

    return usuario;
  }
}

export default new AuthService();
