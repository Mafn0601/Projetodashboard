import { Request, Response } from 'express';
import { chamadoService } from '../services/chamadoService';
import { UrgenciaChamado, StatusChamado } from '@prisma/client';

export const chamadoController = {
  async criar(req: Request, res: Response) {
    try {
      const { email, assunto, urgencia, descricao } = req.body;

      console.log('📥 Recebendo chamado:', { email, assunto, urgencia });

      // Validação básica
      if (!email || !assunto || !urgencia || !descricao) {
        console.log('❌ Validação falhou - campos faltando');
        return res.status(400).json({
          error: 'Todos os campos são obrigatórios',
        });
      }

      // Validar urgência
      if (!Object.values(UrgenciaChamado).includes(urgencia)) {
        console.log('❌ Urgência inválida:', urgencia);
        return res.status(400).json({
          error: 'Urgência inválida',
        });
      }

      const chamado = await chamadoService.criar({
        email,
        assunto,
        urgencia,
        descricao,
      });

      console.log('✅ Chamado criado com sucesso:', chamado.id);
      return res.status(201).json(chamado);
    } catch (error) {
      console.error('❌ Erro ao criar chamado:', error);
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
      const { id } = req.params;
      const chamado = await chamadoService.buscarPorId(id);

      if (!chamado) {
        return res.status(404).json({
          error: 'Chamado não encontrado',
        });
      }

      return res.json(chamado);
    } catch (error) {
      console.error('Erro ao buscar chamado:', error);
      return res.status(500).json({
        error: 'Erro ao buscar chamado',
      });
    }
  },

  async atualizarStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validar status
      if (!Object.values(StatusChamado).includes(status)) {
        return res.status(400).json({
          error: 'Status inválido',
        });
      }

      const chamado = await chamadoService.atualizarStatus(id, { status });
      return res.json(chamado);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return res.status(500).json({
        error: 'Erro ao atualizar status',
      });
    }
  },

  async deletar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await chamadoService.deletar(id);
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar chamado:', error);
      return res.status(500).json({
        error: 'Erro ao deletar chamado',
      });
    }
  },
};
