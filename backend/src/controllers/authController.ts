import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import { loginSchema, registerSchema } from '../validators/schemas';
import { AuthRequest } from '../middlewares/auth';

export class AuthController {
  // registra um novo usuário
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await authService.register(validatedData);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  // faz login e retorna o token
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await authService.login(validatedData.email, validatedData.senha);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // pega dados do usuário logado
  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuario = await authService.getMe(req.user!.userId);
      res.json(usuario);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
