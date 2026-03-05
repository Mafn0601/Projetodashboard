import prisma from '../lib/prisma';
import { supabase } from '../lib/supabase';
import { AppError } from '../middlewares/errorHandler';
import { Prisma } from '@prisma/client';

export class TipoOSService {
  async findAll() {
    const tiposOS = await prisma.tipoOS.findMany({
      include: {
        itens: {
          orderBy: { nome: 'asc' },
        },
      },
      orderBy: { nome: 'asc' },
    });

    return tiposOS;
  }

  async findById(id: string) {
    const tipoOS = await prisma.tipoOS.findUnique({
      where: { id },
      include: {
        itens: true,
      },
    });

    if (!tipoOS) {
      throw new AppError('Tipo de OS não encontrado', 404);
    }

    return tipoOS;
  }

  async create(data: Prisma.TipoOSCreateInput) {
    const tipoOS = await prisma.tipoOS.create({
      data,
      include: {
        itens: true,
      },
    });

    return tipoOS;
  }

  async update(id: string, data: Prisma.TipoOSUpdateInput) {
    const exists = await prisma.tipoOS.findUnique({ where: { id } });

    if (!exists) {
      throw new AppError('Tipo de OS não encontrado', 404);
    }

    const tipoOS = await prisma.tipoOS.update({
      where: { id },
      data,
      include: {
        itens: true,
      },
    });

    return tipoOS;
  }

  async delete(id: string) {
    const exists = await prisma.tipoOS.findUnique({ where: { id } });

    if (!exists) {
      throw new AppError('Tipo de OS não encontrado', 404);
    }

    await prisma.tipoOS.delete({ where: { id } });

    // Deletar também do Supabase
    try {
      await supabase.from('tiposOs').delete().eq('id', id);
    } catch (error) {
      console.error('Erro ao deletar TipoOS do Supabase:', error);
      // Não lança erro se falhar no Supabase
    }

    return { message: 'Tipo de OS deletado com sucesso' };
  }

  // ==================== ITENS ====================

  async createItem(data: Prisma.TipoOSItemCreateInput) {
    const item = await prisma.tipoOSItem.create({
      data,
    });

    return item;
  }

  async updateItem(id: string, data: Prisma.TipoOSItemUpdateInput) {
    const exists = await prisma.tipoOSItem.findUnique({ where: { id } });

    if (!exists) {
      throw new AppError('Item não encontrado', 404);
    }

    const item = await prisma.tipoOSItem.update({
      where: { id },
      data,
    });

    return item;
  }

  async deleteItem(id: string) {
    const exists = await prisma.tipoOSItem.findUnique({ where: { id } });

    if (!exists) {
      throw new AppError('Item não encontrado', 404);
    }

    await prisma.tipoOSItem.delete({ where: { id } });

    // Deletar também do Supabase
    try {
      await supabase.from('tipoOSItems').delete().eq('id', id);
    } catch (error) {
      console.error('Erro ao deletar TipoOSItem do Supabase:', error);
      // Não lança erro se falhar no Supabase
    }

    return { message: 'Item deletado com sucesso' };
  }
}

export default new TipoOSService();
