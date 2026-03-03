/**
 * Cliente Service - API Integration
 * Comunicação com o backend via HTTP REST API
 */

import { ClienteCompleto } from './clienteService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface FindAllFilters {
  search?: string;
  ativo?: boolean;
  skip?: number;
  take?: number;
}

interface FindAllResponse {
  total: number;
  data: ClienteCompleto[];
}

class ClienteServiceAPI {
  private buildQueryParams(filters: FindAllFilters): string {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.ativo !== undefined) params.append('ativo', String(filters.ativo));
    if (filters.skip !== undefined) params.append('skip', String(filters.skip));
    if (filters.take !== undefined) params.append('take', String(filters.take));
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  async findAll(filters: FindAllFilters = {}): Promise<ClienteCompleto[]> {
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
      const response = await fetch(`${API_URL}/api/clientes${queryString}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar clientes: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Clientes carregados:', result);
      
      // Se a resposta tem estrutura {data, total}, retorna apenas data
      return result.data || result;
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      return [];
    }
  }

  async findById(id: string): Promise<ClienteCompleto | null> {
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

      const response = await fetch(`${API_URL}/api/clientes/${id}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Cliente não encontrado: ${response.statusText}`);
      }

      const cliente = await response.json();
      console.log('✅ Cliente encontrado:', cliente);
      return cliente;
    } catch (error) {
      console.error('❌ Erro ao buscar cliente:', error);
      return null;
    }
  }

  async create(cliente: Partial<ClienteCompleto>): Promise<ClienteCompleto | null> {
    try {
      console.log('📤 Criando cliente:', cliente);
      
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

      const response = await fetch(`${API_URL}/api/clientes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(cliente),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erro ao criar cliente: ${error.error}`);
      }

      const novoCliente = await response.json();
      console.log('✅ Cliente criado:', novoCliente);
      return novoCliente;
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error);
      return null;
    }
  }

  async update(id: string, cliente: Partial<ClienteCompleto>): Promise<ClienteCompleto | null> {
    try {
      console.log('📤 Atualizando cliente:', id, cliente);
      
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

      const response = await fetch(`${API_URL}/api/clientes/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(cliente),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erro ao atualizar cliente: ${error.error}`);
      }

      const clienteAtualizado = await response.json();
      console.log('✅ Cliente atualizado:', clienteAtualizado);
      return clienteAtualizado;
    } catch (error) {
      console.error('❌ Erro ao atualizar cliente:', error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      console.log('📤 Deletando cliente:', id);
      
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

      const response = await fetch(`${API_URL}/api/clientes/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erro ao deletar cliente: ${error.error}`);
      }

      console.log('✅ Cliente deletado');
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar cliente:', error);
      return false;
    }
  }
}

export const clienteServiceAPI = new ClienteServiceAPI();
