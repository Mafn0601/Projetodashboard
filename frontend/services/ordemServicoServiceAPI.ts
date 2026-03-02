/**
 * Ordem de Serviço Service - API Integration
 * Comunicação com o backend via HTTP REST API
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface OrdemServico {
  id: string;
  numeroOS: string;
  clienteId: string;
  veiculoId: string;
  responsavelId: string;
  parceiroId?: string;
  agendamentoId?: string;
  status: 'ABERTA' | 'EM_EXECUCAO' | 'FINALIZADA' | 'CANCELADA';
  dataCriacao: string;
  dataFinalizado?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

interface FindAllFilters {
  status?: string;
  clienteId?: string;
  responsavelId?: string;
  dataInicio?: string;
  dataFim?: string;
  skip?: number;
  take?: number;
}

class OrdemServicoServiceAPI {
  private buildQueryParams(filters: FindAllFilters): string {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.clienteId) params.append('clienteId', filters.clienteId);
    if (filters.responsavelId) params.append('responsavelId', filters.responsavelId);
    if (filters.dataInicio) params.append('dataInicio', filters.dataInicio);
    if (filters.dataFim) params.append('dataFim', filters.dataFim);
    if (filters.skip !== undefined) params.append('skip', String(filters.skip));
    if (filters.take !== undefined) params.append('take', String(filters.take));
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  async findAll(filters: FindAllFilters = {}): Promise<OrdemServico[]> {
    try {
      const queryString = this.buildQueryParams(filters);
      const response = await fetch(`${API_URL}/api/ordens-servico${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar ordens de serviço: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Ordens de serviço carregadas:', result);
      
      return result.data || result;
    } catch (error) {
      console.error('❌ Erro ao buscar ordens de serviço:', error);
      return [];
    }
  }

  async findById(id: string): Promise<OrdemServico | null> {
    try {
      const response = await fetch(`${API_URL}/api/ordens-servico/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Ordem de serviço não encontrada: ${response.statusText}`);
      }

      const ordemServico = await response.json();
      console.log('✅ Ordem de serviço encontrada:', ordemServico);
      return ordemServico;
    } catch (error) {
      console.error('❌ Erro ao buscar ordem de serviço:', error);
      return null;
    }
  }

  async create(ordemServico: Partial<OrdemServico>): Promise<OrdemServico | null> {
    try {
      console.log('📤 Criando ordem de serviço:', ordemServico);
      
      const response = await fetch(`${API_URL}/api/ordens-servico`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ordemServico),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erro ao criar ordem de serviço: ${error.error}`);
      }

      const novaOrdem = await response.json();
      console.log('✅ Ordem de serviço criada:', novaOrdem);
      return novaOrdem;
    } catch (error) {
      console.error('❌ Erro ao criar ordem de serviço:', error);
      return null;
    }
  }

  async update(id: string, ordemServico: Partial<OrdemServico>): Promise<OrdemServico | null> {
    try {
      console.log('📤 Atualizando ordem de serviço:', id, ordemServico);
      
      const response = await fetch(`${API_URL}/api/ordens-servico/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ordemServico),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erro ao atualizar ordem de serviço: ${error.error}`);
      }

      const ordemAtualizada = await response.json();
      console.log('✅ Ordem de serviço atualizada:', ordemAtualizada);
      return ordemAtualizada;
    } catch (error) {
      console.error('❌ Erro ao atualizar ordem de serviço:', error);
      return null;
    }
  }

  async updateStatus(id: string, status: string): Promise<OrdemServico | null> {
    try {
      console.log('📤 Atualizando status da ordem:', id, status);
      
      const response = await fetch(`${API_URL}/api/ordens-servico/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erro ao atualizar status: ${error.error}`);
      }

      const ordemAtualizada = await response.json();
      console.log('✅ Status atualizado:', ordemAtualizada);
      return ordemAtualizada;
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      console.log('📤 Deletando ordem de serviço:', id);
      
      const response = await fetch(`${API_URL}/api/ordens-servico/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erro ao deletar ordem de serviço: ${error.error}`);
      }

      console.log('✅ Ordem de serviço deletada');
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar ordem de serviço:', error);
      return false;
    }
  }
}

export const ordemServicoServiceAPI = new OrdemServicoServiceAPI();
