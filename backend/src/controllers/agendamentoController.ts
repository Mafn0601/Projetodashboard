import { Request, Response, NextFunction } from 'express';
import agendamentoService from '../services/agendamentoService';
import { createAgendamentoSchema, updateAgendamentoSchema } from '../validators/schemas';

export class AgendamentoController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, clienteId, responsavelId, dataInicio, dataFim, skip, take } = req.query;
      
      const filters = {
        status: status as string,
        clienteId: clienteId as string,
        responsavelId: responsavelId as string,
        dataInicio: dataInicio as string,
        dataFim: dataFim as string,
        skip: skip ? parseInt(skip as string) : undefined,
        take: take ? parseInt(take as string) : undefined,
      };

      const result = await agendamentoService.findAll(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const agendamento = await agendamentoService.findById(id);
      res.json(agendamento);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createAgendamentoSchema.parse(req.body);
      
      // Transformar para formato Prisma
      const agendamento = await agendamentoService.create({
        cliente: { connect: { id: validatedData.clienteId } },
        veiculo: validatedData.veiculoId ? { connect: { id: validatedData.veiculoId } } : undefined,
        responsavel: { connect: { id: validatedData.responsavelId } },
        parceiro: validatedData.parceiroId ? { connect: { id: validatedData.parceiroId } } : undefined,
        dataAgendamento: new Date(validatedData.dataAgendamento),
        horarioAgendamento: validatedData.horarioAgendamento,
        tipoAgendamento: validatedData.tipoAgendamento,
        descricaoServico: validatedData.descricaoServico,
        observacoes: validatedData.observacoes,
        quilometragem: validatedData.quilometragem,
      });
      
      res.status(201).json(agendamento);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = updateAgendamentoSchema.parse(req.body);
      
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
      if (validatedData.dataAgendamento) {
        updateData.dataAgendamento = new Date(validatedData.dataAgendamento);
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
      const { id } = req.params;
      const result = await agendamentoService.delete(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new AgendamentoController();
