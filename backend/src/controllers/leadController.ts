import { Response, NextFunction } from 'express';
import leadService from '../services/leadService';
import { AuthRequest } from '../middlewares/auth';
import {
  createLeadSchema,
  leadListQuerySchema,
  leadParamsSchema,
  updateLeadSchema,
} from '../validators/schemas';

function applyMineFilter<T extends { mine?: boolean; responsavelId?: string }>(
  filters: T,
  userId?: string
): T {
  if (filters.mine && userId) {
    return {
      ...filters,
      responsavelId: userId,
    };
  }

  return filters;
}

export class LeadController {
  async summary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = applyMineFilter(leadListQuerySchema.parse(req.query), req.user?.userId);
      const result = await leadService.summary(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = applyMineFilter(leadListQuerySchema.parse(req.query), req.user?.userId);
      const result = await leadService.findAll(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = leadParamsSchema.parse(req.params);
      const lead = await leadService.findById(id);
      res.json(lead);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createLeadSchema.parse(req.body);
      const lead = await leadService.create({
        ...validatedData,
        responsavelId: validatedData.responsavelId || req.user?.userId,
      });
      res.status(201).json(lead);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = leadParamsSchema.parse(req.params);
      const validatedData = updateLeadSchema.parse(req.body);
      const lead = await leadService.update(id, validatedData);
      res.json(lead);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = leadParamsSchema.parse(req.params);
      const result = await leadService.delete(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new LeadController();