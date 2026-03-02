import { Request, Response, NextFunction } from 'express';
import parceiroService from '../services/parceiroService';
import { createParceiroSchema, updateParceiroSchema } from '../validators/schemas';

export class ParceiroController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, ativo, skip, take } = req.query;

      const filters = {
        search: search as string,
        ativo: ativo === 'true' ? true : ativo === 'false' ? false : undefined,
        skip: skip ? parseInt(skip as string) : undefined,
        take: take ? parseInt(take as string) : undefined,
      };

      const result = await parceiroService.findAll(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parceiro = await parceiroService.findById(id);
      res.json(parceiro);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createParceiroSchema.parse(req.body);
      const parceiro = await parceiroService.create(validatedData);
      res.status(201).json(parceiro);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = updateParceiroSchema.parse(req.body);
      const parceiro = await parceiroService.update(id, validatedData);
      res.json(parceiro);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await parceiroService.delete(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new ParceiroController();
