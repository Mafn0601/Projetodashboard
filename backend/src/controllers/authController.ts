import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import { changePasswordSchema, loginSchema, registerSchema } from '../validators/schemas';
import { AuthRequest } from '../middlewares/auth';

export class AuthController {
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarios = await authService.listUsers();
      res.json(usuarios);
    } catch (error) {
      next(error);
    }
  }

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

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = changePasswordSchema.parse(req.body);
      const result = await authService.changePassword(
        req.user!.userId,
        validatedData.senhaAtual,
        validatedData.novaSenha
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
