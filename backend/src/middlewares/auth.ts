import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

// middleware de autenticação
export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // ⚠️ BYPASS PARA DESENVOLVIMENTO - remover em produção
    if (process.env.SKIP_AUTH === 'true') {
      console.log('⚠️ AUTENTICAÇÃO DESABILITADA (SKIP_AUTH=true)');
      req.user = {
        userId: 'dev-user',
        email: 'dev@example.com',
        role: 'ADMIN'
      };
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError('Token não fornecido', 401);
    }

    // formato esperado: "Bearer <token>"
    const [, token] = authHeader.split(' ');

    if (!token) {
      throw new AppError('Token inválido', 401);
    }

    // Suporte para tokens MOCK (desenvolvimento)
    if (token.startsWith('mock-token-')) {
      console.log('⚠️ Usando token MOCK para desenvolvimento');

      const MOCK_MAP: Record<string, { userId: string; email: string; role: string }> = {
        'mock-token-admin-123':       { userId: '11111111-1111-4111-8111-111111111111', email: 'admin@exemplo.com',       role: 'ADMIN' },
        'mock-token-gerente-123':     { userId: '33333333-3333-4333-8333-333333333333', email: 'gerente@exemplo.com',     role: 'GERENTE' },
        'mock-token-consultor-123':   { userId: '22222222-2222-4222-8222-222222222222', email: 'consultor@exemplo.com',   role: 'PARCEIRO' },
        'mock-token-operacional-123': { userId: '44444444-4444-4444-8444-444444444444', email: 'operacional@exemplo.com', role: 'OPERADOR' },
        // alias legado
        'mock-token-vendedor-123':    { userId: '22222222-2222-4222-8222-222222222222', email: 'vendedor@exemplo.com',    role: 'PARCEIRO' },
      };

      req.user = MOCK_MAP[token] ?? {
        userId: '55555555-5555-4555-8555-555555555555',
        email: 'unknown@exemplo.com',
        role: 'PARCEIRO',
      };

      return next();
    }

    // Token JWT real
    const payload = verifyToken(token);
    req.user = payload;

    next();
  } catch (error) {
    next(new AppError('Token inválido ou expirado', 401));
  }
}

// middleware de autorização por role
export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Não autorizado', 401));
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return next(new AppError('Sem permissão para acessar este recurso', 403));
    }

    next();
  };
}
