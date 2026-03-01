import { prisma } from '../lib/prisma';
import { UrgenciaChamado, StatusChamado } from '@prisma/client';

interface CriarChamadoData {
  email: string;
  assunto: string;
  urgencia: UrgenciaChamado;
  descricao: string;
}

interface AtualizarStatusData {
  status: StatusChamado;
}

export const chamadoService = {
  async criar(data: CriarChamadoData) {
    return await prisma.chamado.create({
      data: {
        email: data.email,
        assunto: data.assunto,
        urgencia: data.urgencia,
        descricao: data.descricao,
        status: StatusChamado.ABERTO,
      },
    });
  },

  async listarTodos() {
    return await prisma.chamado.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  async buscarPorId(id: string) {
    return await prisma.chamado.findUnique({
      where: { id },
    });
  },

  async atualizarStatus(id: string, data: AtualizarStatusData) {
    return await prisma.chamado.update({
      where: { id },
      data: {
        status: data.status,
      },
    });
  },

  async deletar(id: string) {
    return await prisma.chamado.delete({
      where: { id },
    });
  },
};
