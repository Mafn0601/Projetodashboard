import { NextFunction, Response } from 'express';
import financeiroService from '../services/financeiroService';
import { AuthRequest } from '../../../middlewares/auth';
import {
  financeiroContaParamsSchema,
  financeiroFluxoQuerySchema,
  financeiroFaturaSchema,
  financeiroListQuerySchema,
  financeiroPagamentoSchema,
  financeiroRelatoriosQuerySchema,
} from '../../../validators/schemas';

export class FinanceiroController {
  async dashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await financeiroService.dashboard();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async contasReceber(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = financeiroListQuerySchema.parse(req.query);
      const result = await financeiroService.contasReceber(filters as never);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async contasPagar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = financeiroListQuerySchema.parse(req.query);
      const result = await financeiroService.contasPagar(filters as never);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async fluxoCaixa(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = financeiroFluxoQuerySchema.parse(req.query);
      const result = await financeiroService.fluxoCaixa(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createFatura(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payload = financeiroFaturaSchema.parse(req.body);
      const created = await financeiroService.createFatura(payload);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  async updateFatura(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = financeiroContaParamsSchema.parse(req.params);
      const payload = financeiroFaturaSchema.partial().parse(req.body);
      const updated = await financeiroService.updateFatura(id, payload);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  async deleteFatura(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = financeiroContaParamsSchema.parse(req.params);
      const deleted = await financeiroService.deleteFatura(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Fatura não encontrada' });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async createPagamento(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payload = financeiroPagamentoSchema.parse(req.body);
      const created = await financeiroService.createPagamento(payload);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  async updatePagamento(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = financeiroContaParamsSchema.parse(req.params);
      const payload = financeiroPagamentoSchema.partial().parse(req.body);
      const updated = await financeiroService.updatePagamento(id, payload);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  async relatorios(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = financeiroRelatoriosQuerySchema.parse(req.query);
      const result = await financeiroService.relatorios(query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async configuracoes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await financeiroService.configuracoes();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new FinanceiroController();
