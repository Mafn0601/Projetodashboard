import prisma from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middlewares/errorHandler';

function mapEquipeFuncaoToRole(funcao?: string): 'ADMIN' | 'GERENTE' | 'OPERADOR' | 'PARCEIRO' {
  const value = String(funcao || '').trim().toLowerCase();

  if (value === 'admin' || value === 'administrador') return 'ADMIN';
  if (value.includes('gerente')) return 'GERENTE';
  if (value === 'operador' || value === 'tecnico' || value === 'auxiliar_administrativo') return 'OPERADOR';

  return 'PARCEIRO';
}

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

  async login(identifier: string, senha: string) {
    const normalizedIdentifier = identifier.trim().toLowerCase();

    let usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { email: normalizedIdentifier },
          { login: normalizedIdentifier },
        ],
      },
    });

    // Compatibilidade: equipes antigas podiam existir sem registro em "usuarios".
    if (!usuario) {
      const equipe = await prisma.equipe.findFirst({
        where: {
          ativo: true,
          OR: [
            { email: normalizedIdentifier },
            { login: normalizedIdentifier },
          ],
        },
      });

      if (equipe) {
        const senhaEquipeValida = await comparePassword(senha, equipe.senha);
        if (senhaEquipeValida && equipe.email) {
          const emailEquipe = equipe.email.trim().toLowerCase();
          const loginEquipe = equipe.login.trim().toLowerCase();

          const usuarioComMesmoEmail = await prisma.usuario.findUnique({ where: { email: emailEquipe } });
          const usuarioComMesmoLogin = await prisma.usuario.findUnique({ where: { login: loginEquipe } });

          if (!usuarioComMesmoEmail && !usuarioComMesmoLogin) {
            await prisma.usuario.create({
              data: {
                nome: loginEquipe,
                login: loginEquipe,
                email: emailEquipe,
                senha: equipe.senha,
                role: mapEquipeFuncaoToRole(equipe.funcao),
                ativo: equipe.ativo,
                parceiroId: equipe.parceiroId,
              },
            });
          }

          usuario = await prisma.usuario.findFirst({
            where: {
              OR: [{ email: normalizedIdentifier }, { login: normalizedIdentifier }],
            },
          });
        }
      }
    }

    if (!usuario) {
      throw new AppError('Credenciais inválidas', 401);
    }

    // Se existir equipe vinculada por login/email, alinhar role automaticamente.
    const equipeRelacionada = await prisma.equipe.findFirst({
      where: {
        OR: [{ login: usuario.login }, { email: usuario.email }],
      },
      select: { funcao: true },
    });

    if (equipeRelacionada) {
      const roleEsperada = mapEquipeFuncaoToRole(equipeRelacionada.funcao);
      if (usuario.role !== roleEsperada) {
        usuario = await prisma.usuario.update({
          where: { id: usuario.id },
          data: { role: roleEsperada },
        });
      }
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

  async changePassword(userId: string, senhaAtual: string, novaSenha: string) {
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });

    if (!usuario) {
      throw new AppError('Usuário não encontrado', 404);
    }

    const senhaValida = await comparePassword(senhaAtual, usuario.senha);
    if (!senhaValida) {
      throw new AppError('Senha atual inválida', 401);
    }

    const novaSenhaHash = await hashPassword(novaSenha);

    await prisma.usuario.update({
      where: { id: userId },
      data: { senha: novaSenhaHash },
    });

    return { message: 'Senha alterada com sucesso' };
  }
}

export default new AuthService();
