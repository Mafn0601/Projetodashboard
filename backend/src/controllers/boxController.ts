import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth';

export class BoxController {
  async findAll(req: AuthRequest, res: Response) {
    try {
      const boxes = await prisma.box.findMany({
        orderBy: { numero: 'asc' },
      });

      return res.json(boxes);
    } catch (error) {
      console.error('Erro ao buscar boxes:', error);
      return res.status(500).json({ 
        error: 'Erro ao buscar boxes',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async findById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const box = await prisma.box.findUnique({
        where: { id },
      });

      if (!box) {
        return res.status(404).json({ error: 'Box não encontrado' });
      }

      return res.json(box);
    } catch (error) {
      console.error('Erro ao buscar box:', error);
      return res.status(500).json({ 
        error: 'Erro ao buscar box',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const { numero, nome, descricao, tipo, parceiroId, parceiro, cor, ativo } = req.body;

      // Validação básica
      if (!numero || !nome) {
        return res.status(400).json({ 
          error: 'Número e nome são obrigatórios' 
        });
      }

      // Verifica se já existe box com esse número
      const existingBox = await prisma.box.findUnique({
        where: { numero },
      });

      if (existingBox) {
        return res.status(400).json({ 
          error: 'Já existe um box com este número' 
        });
      }

      const box = await prisma.box.create({
        data: {
          numero,
          nome,
          descricao,
          tipo,
          parceiroId,
          parceiro,
          cor,
          ativo: ativo !== undefined ? ativo : true,
        },
      });

      return res.status(201).json(box);
    } catch (error) {
      console.error('Erro ao criar box:', error);
      return res.status(500).json({ 
        error: 'Erro ao criar box',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { numero, nome, descricao, tipo, parceiroId, parceiro, cor, ativo } = req.body;

      // Verifica se o box existe
      const existingBox = await prisma.box.findUnique({
        where: { id },
      });

      if (!existingBox) {
        return res.status(404).json({ error: 'Box não encontrado' });
      }

      // Se está mudando o número, verifica se não conflita com outro box
      if (numero && numero !== existingBox.numero) {
        const conflictingBox = await prisma.box.findUnique({
          where: { numero },
        });

        if (conflictingBox) {
          return res.status(400).json({ 
            error: 'Já existe outro box com este número' 
          });
        }
      }

      const box = await prisma.box.update({
        where: { id },
        data: {
          ...(numero && { numero }),
          ...(nome && { nome }),
          ...(descricao !== undefined && { descricao }),
          ...(tipo !== undefined && { tipo }),
          ...(parceiroId !== undefined && { parceiroId }),
          ...(parceiro !== undefined && { parceiro }),
          ...(cor !== undefined && { cor }),
          ...(ativo !== undefined && { ativo }),
        },
      });

      return res.json(box);
    } catch (error) {
      console.error('Erro ao atualizar box:', error);
      return res.status(500).json({ 
        error: 'Erro ao atualizar box',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Verifica se o box existe
      const existingBox = await prisma.box.findUnique({
        where: { id },
      });

      if (!existingBox) {
        return res.status(404).json({ error: 'Box não encontrado' });
      }

      // Verifica se há ocupações ativas
      const activeOcupacoes = await prisma.boxOcupacao.count({
        where: {
          boxId: id,
          dataSaida: null,
        },
      });

      if (activeOcupacoes > 0) {
        return res.status(400).json({ 
          error: 'Não é possível deletar box com ocupações ativas. Desative-o ao invés disso.' 
        });
      }

      await prisma.box.delete({
        where: { id },
      });

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar box:', error);
      return res.status(500).json({ 
        error: 'Erro ao deletar box',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new BoxController();
