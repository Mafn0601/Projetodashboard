import { Request, Response, NextFunction } from 'express';
import orcamentoService from '../services/orcamentoService';
import {
  createOrcamentoSchema,
  orcamentoListQuerySchema,
  orcamentoParamsSchema,
} from '../validators/schemas';

export class OrcamentoController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = orcamentoListQuerySchema.parse(req.query);
      const result = await orcamentoService.findAll(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = orcamentoParamsSchema.parse(req.params);
      const orcamento = await orcamentoService.findById(id);
      res.json(orcamento);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createOrcamentoSchema.parse(req.body);
      const orcamento = await orcamentoService.create(validatedData);
      res.status(201).json(orcamento);
    } catch (error) {
      next(error);
    }
  }
}

export default new OrcamentoController();
