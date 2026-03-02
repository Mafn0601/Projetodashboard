import { Request, Response, NextFunction } from 'express';
import veiculoService from '../services/veiculoService';
import { createVeiculoSchema, updateVeiculoSchema } from '../validators/schemas';

export class VeiculoController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { clienteId, placa, search, skip, take } = req.query;

      const filters = {
        clienteId: clienteId as string,
        placa: placa as string,
        search: search as string,
        skip: skip ? parseInt(skip as string) : undefined,
        take: take ? parseInt(take as string) : undefined,
      };

      const result = await veiculoService.findAll(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const veiculo = await veiculoService.findById(id);
      res.json(veiculo);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createVeiculoSchema.parse(req.body);

      const veiculo = await veiculoService.create({
        clienteId: validatedData.clienteId,
        placa: validatedData.placa,
        chassi: validatedData.chassi,
        marca: validatedData.marca,
        modelo: validatedData.modelo,
        fabricante: validatedData.fabricante,
        anoFabricacao: validatedData.anoFabricacao,
        anoModelo: validatedData.anoModelo,
        cor: validatedData.cor,
        combustivel: validatedData.combustivel,
      });

      res.status(201).json(veiculo);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = updateVeiculoSchema.parse(req.body);

      const veiculo = await veiculoService.update(id, validatedData);
      res.json(veiculo);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await veiculoService.delete(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new VeiculoController();
