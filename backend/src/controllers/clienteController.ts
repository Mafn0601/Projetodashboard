import { Request, Response, NextFunction } from 'express';
import clienteService from '../services/clienteService';
import {
  clienteListQuerySchema,
  clienteParamsSchema,
  createClienteSchema,
  updateClienteSchema,
} from '../validators/schemas';

export class ClienteController {
  // busca todos os clientes (com filtros opcionais)
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = clienteListQuerySchema.parse(req.query);

      const result = await clienteService.findAll(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = clienteParamsSchema.parse(req.params);
      const cliente = await clienteService.findById(id);
      res.json(cliente);
    } catch (error) {
      next(error);
    }
  }

  // cria um cliente novo
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createClienteSchema.parse(req.body);
      const cliente = await clienteService.create(validatedData);
      res.status(201).json(cliente);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = clienteParamsSchema.parse(req.params);
      const validatedData = updateClienteSchema.parse(req.body);
      const cliente = await clienteService.update(id, validatedData);
      res.json(cliente);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = clienteParamsSchema.parse(req.params);
      const result = await clienteService.delete(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new ClienteController();
