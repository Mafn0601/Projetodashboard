import { Request, Response } from 'express';
import { chamadoService } from '../services/chamadoService';
import { ZodError } from 'zod';
import {
  chamadoParamsSchema,
  createChamadoSchema,
  updateChamadoStatusSchema,
} from '../validators/schemas';
import { AppError } from '../middlewares/errorHandler';

export const chamadoController = {
  async criar(req: Request, res: Response) {
    try {
      const validatedData = createChamadoSchema.parse(req.body);

      const chamado = await chamadoService.criar({
        email: validatedData.email,
        assunto: validatedData.assunto,
        urgencia: validatedData.urgencia,
        descricao: validatedData.descricao,
      });

      return res.status(201).json(chamado);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }

      return res.status(500).json({
        error: 'Erro ao criar chamado',
      });
    }
  },

  async listarTodos(req: Request, res: Response) {
    try {
      const chamados = await chamadoService.listarTodos();
      return res.json(chamados);
    } catch (error) {
      console.error('Erro ao listar chamados:', error);
      return res.status(500).json({
        error: 'Erro ao listar chamados',
      });
    }
  },

  async buscarPorId(req: Request, res: Response) {
    try {
      const { id } = chamadoParamsSchema.parse(req.params);
      const chamado = await chamadoService.buscarPorId(id);

      if (!chamado) {
        return res.status(404).json({
          error: 'Chamado não encontrado',
        });
      }

      return res.json(chamado);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }

      console.error('Erro ao buscar chamado:', error);
      return res.status(500).json({
        error: 'Erro ao buscar chamado',
      });
    }
  },

  async atualizarStatus(req: Request, res: Response) {
    try {
      const { id } = chamadoParamsSchema.parse(req.params);
      const { status } = updateChamadoStatusSchema.parse(req.body);

      const chamado = await chamadoService.atualizarStatus(id, { status });
      return res.json(chamado);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }

      return res.status(500).json({
        error: 'Erro ao atualizar status',
      });
    }
  },

  async deletar(req: Request, res: Response) {
    try {
      const { id } = chamadoParamsSchema.parse(req.params);
      await chamadoService.deletar(id);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }

      return res.status(500).json({
        error: 'Erro ao deletar chamado',
      });
    }
  },
};
