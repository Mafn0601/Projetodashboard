import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export class StatusController {
  async findAll(req: Request, res: Response) {
    try {
      const statusCards = await prisma.statusCard.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return res.json(statusCards);
    } catch (error) {
      console.error('Erro ao buscar status cards:', error);
      return res.status(500).json({ error: 'Erro ao buscar status cards' });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const statusCard = await prisma.statusCard.findUnique({
        where: { id },
      });
      
      if (!statusCard) {
        return res.status(404).json({ error: 'Status card não encontrado' });
      }
      
      return res.json(statusCard);
    } catch (error) {
      console.error('Erro ao buscar status card:', error);
      return res.status(500).json({ error: 'Erro ao buscar status card' });
    }
  }

  async findByStatus(req: Request, res: Response) {
    try {
      const { status } = req.params;
      const statusCards = await prisma.statusCard.findMany({
        where: { status },
        orderBy: { numero: 'asc' },
      });
      return res.json(statusCards);
    } catch (error) {
      console.error('Erro ao buscar status cards por status:', error);
      return res.status(500).json({ error: 'Erro ao buscar status cards' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const {
        id,
        numero,
        veiculo,
        dataAgendamento,
        dataEntrega,
        cliente,
        parceiro,
        responsavel,
        status,
        boxId,
        boxNome,
        agendamentoId,
        horaInicio,
        horaFim,
        formaPagamento,
        meioPagamento,
      } = req.body;

      // Validação básica
      if (!numero || !veiculo || !dataAgendamento || !dataEntrega || !cliente || !parceiro || !responsavel) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando' });
      }

      // Verificar se número é único
      const existente = await prisma.statusCard.findUnique({
        where: { numero },
      });

      if (existente) {
        return res.status(400).json({ error: 'Número de status card já existe' });
      }

      const statusCard = await prisma.statusCard.create({
        data: {
          ...(id && { id }),
          numero,
          veiculo,
          dataAgendamento: new Date(dataAgendamento),
          dataEntrega: new Date(dataEntrega),
          cliente,
          parceiro,
          responsavel,
          status: status || 'recebido',
          ...(boxId && { boxId }),
          ...(boxNome && { boxNome }),
          ...(agendamentoId && { agendamentoId }),
          ...(horaInicio && { horaInicio }),
          ...(horaFim && { horaFim }),
          ...(formaPagamento && { formaPagamento }),
          ...(meioPagamento && { meioPagamento }),
        },
      });

      return res.status(201).json(statusCard);
    } catch (error) {
      console.error('Erro ao criar status card:', error);
      return res.status(500).json({ error: 'Erro ao criar status card' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        numero,
        veiculo,
        dataAgendamento,
        dataEntrega,
        cliente,
        parceiro,
        responsavel,
        status,
        boxId,
        boxNome,
        horaInicio,
        horaFim,
        formaPagamento,
        meioPagamento,
      } = req.body;

      // Verificar se numero é único (se está sendo alterado)
      if (numero) {
        const existente = await prisma.statusCard.findFirst({
          where: {
            numero,
            id: { not: id }, // Exclui o registro atual
          },
        });

        if (existente) {
          return res.status(400).json({ error: 'Número de status card já existe' });
        }
      }

      const statusCard = await prisma.statusCard.update({
        where: { id },
        data: {
          ...(numero && { numero }),
          ...(veiculo && { veiculo }),
          ...(dataAgendamento && { dataAgendamento: new Date(dataAgendamento) }),
          ...(dataEntrega && { dataEntrega: new Date(dataEntrega) }),
          ...(cliente && { cliente }),
          ...(parceiro && { parceiro }),
          ...(responsavel && { responsavel }),
          ...(status && { status }),
          ...(boxId !== undefined && { boxId }),
          ...(boxNome !== undefined && { boxNome }),
          ...(horaInicio !== undefined && { horaInicio }),
          ...(horaFim !== undefined && { horaFim }),
          ...(formaPagamento !== undefined && { formaPagamento }),
          ...(meioPagamento !== undefined && { meioPagamento }),
        },
      });

      return res.json(statusCard);
    } catch (error) {
      console.error('Erro ao atualizar status card:', error);
      return res.status(500).json({ error: 'Erro ao atualizar status card' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.statusCard.delete({
        where: { id },
      });

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar status card:', error);
      return res.status(500).json({ error: 'Erro ao deletar status card' });
    }
  }

  async moveCard(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status é obrigatório' });
      }

      // Se movendo para "entregue", registra o timestamp de finalização
      const updateData: any = { status };
      if (status === 'entregue') {
        updateData.timestampFinalizacao = new Date();
      }

      const statusCard = await prisma.statusCard.update({
        where: { id },
        data: updateData,
      });

      return res.json(statusCard);
    } catch (error) {
      console.error('Erro ao mover status card:', error);
      return res.status(500).json({ error: 'Erro ao mover status card' });
    }
  }
}

export default new StatusController();
