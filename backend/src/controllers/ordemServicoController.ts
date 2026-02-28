import { Request, Response, NextFunction } from 'express';
import ordemServicoService from '../services/ordemServicoService';
import { createOrdemServicoSchema, updateOrdemServicoSchema } from '../validators/schemas';
import { StatusOS } from '@prisma/client';

export class OrdemServicoController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, clienteId, responsavelId, skip, take, groupByStatus } = req.query;
      
      if (groupByStatus === 'true') {
        const result = await ordemServicoService.getByStatus(true);
        return res.json(result);
      }
      
      const filters = {
        status: status as StatusOS,
        clienteId: clienteId as string,
        responsavelId: responsavelId as string,
        skip: skip ? parseInt(skip as string) : undefined,
        take: take ? parseInt(take as string) : undefined,
      };

      const result = await ordemServicoService.findAll(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ordemServico = await ordemServicoService.findById(id);
      res.json(ordemServico);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createOrdemServicoSchema.parse(req.body);
      
      // Transformar para formato Prisma
      const ordemServico = await ordemServicoService.create({
        cliente: { connect: { id: validatedData.clienteId } },
        veiculo: { connect: { id: validatedData.veiculoId } },
        responsavel: { connect: { id: validatedData.responsavelId } },
        parceiro: validatedData.parceiroId ? { connect: { id: validatedData.parceiroId } } : undefined,
        agendamento: validatedData.agendamentoId ? { connect: { id: validatedData.agendamentoId } } : undefined,
        descricao: validatedData.descricao,
        observacoes: validatedData.observacoes,
        quilometragem: validatedData.quilometragem,
        dataPrevisao: validatedData.dataPrevisao ? new Date(validatedData.dataPrevisao) : undefined,
        formaPagamento: validatedData.formaPagamento,
        meioPagamento: validatedData.meioPagamento,
        origemPedido: validatedData.origemPedido,
        prioridade: validatedData.prioridade,
      });
      
      res.status(201).json(ordemServico);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = updateOrdemServicoSchema.parse(req.body);
      
      // Transformar para formato Prisma
      const updateData: any = {};
      
      if (validatedData.clienteId) {
        updateData.cliente = { connect: { id: validatedData.clienteId } };
      }
      if (validatedData.veiculoId) {
        updateData.veiculo = { connect: { id: validatedData.veiculoId } };
      }
      if (validatedData.responsavelId) {
        updateData.responsavel = { connect: { id: validatedData.responsavelId } };
      }
      if (validatedData.parceiroId) {
        updateData.parceiro = { connect: { id: validatedData.parceiroId } };
      }
      if (validatedData.dataPrevisao) {
        updateData.dataPrevisao = new Date(validatedData.dataPrevisao);
      }
      if (validatedData.dataFinalizacao) {
        updateData.dataFinalizacao = new Date(validatedData.dataFinalizacao);
      }
      
      Object.assign(updateData, {
        status: validatedData.status,
        descricao: validatedData.descricao,
        observacoes: validatedData.observacoes,
        quilometragem: validatedData.quilometragem,
        formaPagamento: validatedData.formaPagamento,
        meioPagamento: validatedData.meioPagamento,
        origemPedido: validatedData.origemPedido,
        prioridade: validatedData.prioridade,
        valorTotal: validatedData.valorTotal,
        valorDesconto: validatedData.valorDesconto,
      });
      
      const ordemServico = await ordemServicoService.update(id, updateData);
      res.json(ordemServico);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, observacao } = req.body;
      
      const ordemServico = await ordemServicoService.updateStatus(id, status as StatusOS, observacao);
      res.json(ordemServico);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await ordemServicoService.delete(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new OrdemServicoController();
