import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', error);

  // erros customizados da aplicação
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
    });
  }

  // erros de validação do Zod
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: error.errors,
    });
  }

  // erros do Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Registro duplicado para campo único',
        details: error.meta,
      });
    }
    // record not found (foreign key reference)
    if (error.code === 'P2025') {
      return res.status(422).json({
        error: 'Registro relacionado não encontrado',
        details: error.meta,
      });
    }
    // foreign key constraint failed
    if (error.code === 'P2003') {
      return res.status(422).json({
        error: 'Violação de chave estrangeira',
        details: error.meta,
      });
    }
  }

  // qualquer outro erro não tratado
  return res.status(500).json({
    error: 'Internal server error',
  });
}
