import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError('Token não fornecido', 401);
    }

    const [, token] = authHeader.split(' ');

    if (!token) {
      throw new AppError('Token inválido', 401);
    }

    const payload = verifyToken(token);
    req.user = payload;

    next();
  } catch (error) {
    next(new AppError('Token inválido ou expirado', 401));
  }
}

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
