/**
 * Ordem de Serviço Service - API Integration
 * Comunicação com o backend via HTTP REST API
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface OrdemServico {
  id: string;
  numeroOS: string;
  clienteId: string;
  veiculoId: string;
  responsavelId: string;
  parceiroId?: string;
  agendamentoId?: string;
  status: 'AGUARDANDO' | 'EM_ATENDIMENTO' | 'AGUARDANDO_PECAS' | 'EM_EXECUCAO' | 'CONCLUIDO' | 'ENTREGUE';
  dataAbertura: string;
  dataFinalizacao?: string;
  dataPrevisao?: string;
  descricao?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

interface FindAllFilters {
  status?: string;
  clienteId?: string;
  responsavelId?: string;
  parceiroId?: string;
  dataInicio?: string;
  dataFim?: string;
  skip?: number;
  take?: number;
}

class OrdemServicoServiceAPI {
  private authToken: string | null = null;

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  private getAuthHeaders(contentType: boolean = true): Record<string, string> {
    const headers: Record<string, string> = contentType ? { 'Content-Type': 'application/json' } : {};
    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  private buildQueryParams(filters: FindAllFilters): string {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.clienteId) params.append('clienteId', filters.clienteId);
    if (filters.responsavelId) params.append('responsavelId', filters.responsavelId);
    if (filters.parceiroId) params.append('parceiroId', filters.parceiroId);
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
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar ordens de serviço: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Ordens de serviço carregadas:', result);
      
      return result.ordensServico || result.data || result;
    } catch (error) {
      console.error('❌ Erro ao buscar ordens de serviço:', error);
      return [];
    }
  }

  async findById(id: string): Promise<OrdemServico | null> {
    try {
      const response = await fetch(`${API_URL}/api/ordens-servico/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
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

  async findByParceiro(parceiroId: string, filters: { status?: string; skip?: number; take?: number } = {}): Promise<OrdemServico[]> {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.skip !== undefined) params.append('skip', String(filters.skip));
      if (filters.take !== undefined) params.append('take', String(filters.take));

      const queryString = params.toString();
      const response = await fetch(
        `${API_URL}/api/ordens-servico/by-parceiro/${parceiroId}${queryString ? `?${queryString}` : ''}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar ordens de serviço por parceiro: ${response.statusText}`);
      }

      const result = await response.json();
      return result.ordensServico || result.data || result;
    } catch (error) {
      console.error('❌ Erro ao buscar ordens por parceiro:', error);
      return [];
    }
  }

  async create(ordemServico: Partial<OrdemServico>): Promise<OrdemServico | null> {
    try {
      console.log('📤 Criando ordem de serviço:', ordemServico);
      
      const response = await fetch(`${API_URL}/api/ordens-servico`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
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
        headers: this.getAuthHeaders(),
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
        headers: this.getAuthHeaders(),
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
        headers: this.getAuthHeaders(),
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
