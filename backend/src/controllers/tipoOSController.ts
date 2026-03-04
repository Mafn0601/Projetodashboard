import { Request, Response, NextFunction } from 'express';
import tipoOSService from '../services/tipoOSService';
import { createTipoOSSchema, createTipoOSItemSchema } from '../validators/schemas';
import { z } from 'zod';

const idParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export class TipoOSController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tiposOS = await tipoOSService.findAll();
      res.json(tiposOS);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const tipoOS = await tipoOSService.findById(id);
      res.json(tipoOS);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createTipoOSSchema.parse(req.body);

      const tipoOS = await tipoOSService.create({
        nome: validatedData.nome,
        descricao: validatedData.descricao,
      });

      res.status(201).json(tipoOS);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const validatedData = createTipoOSSchema.partial().parse(req.body);

      const tipoOS = await tipoOSService.update(id, validatedData);
      res.json(tipoOS);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const result = await tipoOSService.delete(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ==================== ITENS ====================

  async createItem(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createTipoOSItemSchema.parse(req.body);

      const item = await tipoOSService.createItem({
        tipoOS: { connect: { id: validatedData.tipoOSId } },
        nome: validatedData.nome,
        tipo: validatedData.tipo,
        preco: validatedData.preco,
        desconto: validatedData.desconto || 0,
        duracao: validatedData.duracao,
      });

      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const validatedData = createTipoOSItemSchema.omit({ tipoOSId: true }).partial().parse(req.body);

      const item = await tipoOSService.updateItem(id, validatedData);
      res.json(item);
    } catch (error) {
      next(error);
    }
  }

  async deleteItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const result = await tipoOSService.deleteItem(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new TipoOSController();
