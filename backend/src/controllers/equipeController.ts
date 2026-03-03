import { Request, Response, NextFunction } from 'express';
import equipeService from '../services/equipeService';
import {
  createEquipeSchema,
  equipeListQuerySchema,
  equipeParamsSchema,
  updateEquipeSchema,
} from '../validators/schemas';

export class EquipeController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = equipeListQuerySchema.parse(req.query);

      const result = await equipeService.findAll(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = equipeParamsSchema.parse(req.params);
      const equipe = await equipeService.findById(id);
      res.json(equipe);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createEquipeSchema.parse(req.body);
      const equipe = await equipeService.create(validatedData);
      res.status(201).json(equipe);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = equipeParamsSchema.parse(req.params);
      const validatedData = updateEquipeSchema.parse(req.body);
      const equipe = await equipeService.update(id, validatedData);
      res.json(equipe);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = equipeParamsSchema.parse(req.params);
      const result = await equipeService.delete(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new EquipeController();
