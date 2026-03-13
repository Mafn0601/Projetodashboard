import { Request, Response, NextFunction } from 'express';
import agendamentoService from '../services/agendamentoService';
import { parseBrasiliaInput } from '../lib/brasiliaTime';
import {
  agendamentoListQuerySchema,
  agendamentoParamsSchema,
  createAgendamentoSchema,
  updateAgendamentoSchema,
} from '../validators/schemas';

export class AgendamentoController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = agendamentoListQuerySchema.parse(req.query);

      const result = await agendamentoService.findAll(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = agendamentoParamsSchema.parse(req.params);
      const agendamento = await agendamentoService.findById(id);
      res.json(agendamento);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createAgendamentoSchema.parse(req.body);
      
      // converte pro formato que o Prisma espera
      const agendamento = await agendamentoService.create({
        cliente: { connect: { id: validatedData.clienteId } },
        veiculo: validatedData.veiculoId ? { connect: { id: validatedData.veiculoId } } : undefined,
        responsavel: { connect: { id: validatedData.responsavelId } },
        parceiro: validatedData.parceiroId ? { connect: { id: validatedData.parceiroId } } : undefined,
        tipoOS: validatedData.tipoOSId ? { connect: { id: validatedData.tipoOSId } } : undefined,
        itemOS: validatedData.itemOSId ? { connect: { id: validatedData.itemOSId } } : undefined,
        dataAgendamento: parseBrasiliaInput(validatedData.dataAgendamento),
        horarioAgendamento: validatedData.horarioAgendamento,
        tipoAgendamento: validatedData.tipoAgendamento,
        descricaoServico: validatedData.descricaoServico,
        observacoes: validatedData.observacoes,
        quilometragem: validatedData.quilometragem,
        duracao: validatedData.duracao,
      });
      
      res.status(201).json(agendamento);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = agendamentoParamsSchema.parse(req.params);
      const validatedData = updateAgendamentoSchema.parse(req.body);
      
      // monta o objeto de update pro Prisma
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
      if (validatedData.dataAgendamento) {
        updateData.dataAgendamento = parseBrasiliaInput(validatedData.dataAgendamento);
      }
      
      Object.assign(updateData, {
        horarioAgendamento: validatedData.horarioAgendamento,
        tipoAgendamento: validatedData.tipoAgendamento,
        status: validatedData.status,
        descricaoServico: validatedData.descricaoServico,
        observacoes: validatedData.observacoes,
        quilometragem: validatedData.quilometragem,
      });
      
      const agendamento = await agendamentoService.update(id, updateData);
      res.json(agendamento);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = agendamentoParamsSchema.parse(req.params);
      const result = await agendamentoService.delete(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new AgendamentoController();
