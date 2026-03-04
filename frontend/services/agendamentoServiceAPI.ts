/**
 * Agendamento Service - API Integration
 * Comunicação com o backend via HTTP REST API
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Agendamento {
  id: string;
  clienteId: string;
  veiculoId?: string;
  responsavelId: string;
  parceiroId?: string;
  dataAgendamento: string; // ISO date
  horarioAgendamento?: string;
  tipoAgendamento: string;
  status: 'CONFIRMADO' | 'EXECUTANDO' | 'FINALIZADO' | 'CANCELADO';
  descricaoServico?: string;
  observacoes?: string;
  quilometragem?: string;
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

class AgendamentoServiceAPI {
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

  async findAll(filters: FindAllFilters = {}): Promise<Agendamento[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Adicionar token se disponível
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const queryString = this.buildQueryParams(filters);
      const response = await fetch(`${API_URL}/api/agendamentos${queryString}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar agendamentos: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Agendamentos carregados:', result);
      
      // Backend retorna {agendamentos, total} ou {data, total}
      return result.agendamentos || result.data || result;
    } catch (error) {
      console.error('❌ Erro ao buscar agendamentos:', error);
      return [];
    }
  }

  async findById(id: string): Promise<Agendamento | null> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${API_URL}/api/agendamentos/${id}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Agendamento não encontrado: ${response.statusText}`);
      }

      const agendamento = await response.json();
      console.log('✅ Agendamento encontrado:', agendamento);
      return agendamento;
    } catch (error) {
      console.error('❌ Erro ao buscar agendamento:', error);
      return null;
    }
  }

  async create(agendamento: Partial<Agendamento>): Promise<Agendamento | null> {
    try {
      console.log('📤 Criando agendamento:', agendamento);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${API_URL}/api/agendamentos`, {
        method: 'POST',
        headers,
        body: JSON.stringify(agendamento),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erro ao criar agendamento: ${error.error}`);
      }

      const novoAgendamento = await response.json();
      console.log('✅ Agendamento criado:', novoAgendamento);
      return novoAgendamento;
    } catch (error) {
      console.error('❌ Erro ao criar agendamento:', error);
      return null;
    }
  }

  async update(id: string, agendamento: Partial<Agendamento>): Promise<Agendamento | null> {
    try {
      console.log('📤 Atualizando agendamento:', id, agendamento);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${API_URL}/api/agendamentos/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(agendamento),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erro ao atualizar agendamento: ${error.error}`);
      }

      const agendamentoAtualizado = await response.json();
      console.log('✅ Agendamento atualizado:', agendamentoAtualizado);
      return agendamentoAtualizado;
    } catch (error) {
      console.error('❌ Erro ao atualizar agendamento:', error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      console.log('📤 Deletando agendamento:', id);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${API_URL}/api/agendamentos/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erro ao deletar agendamento: ${error.error}`);
      }

      console.log('✅ Agendamento deletado');
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar agendamento:', error);
      return false;
    }
  }
}

export const agendamentoServiceAPI = new AgendamentoServiceAPI();
