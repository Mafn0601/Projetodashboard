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
      
      // Determinar role baseado no token
      const isMockAdmin = token.includes('admin');
      const isMockVendedor = token.includes('vendedor');
      
      req.user = {
        userId: isMockAdmin ? 'mock-user-admin' : 'mock-user-vendedor',
        email: isMockAdmin ? 'admin@exemplo.com' : 'vendedor@exemplo.com',
        role: isMockAdmin ? 'ADMIN' : 'VENDEDOR'
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
