/**
 * Cliente Service - API Integration
 * Comunicação com o backend via HTTP REST API
 */

import { ClienteCompleto } from './clienteService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const CLIENTES_CACHE_KEY = 'cache_api_clientes_v1';

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
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log('🔐 Token obtido:', token ? `${token.substring(0, 20)}...` : 'NENHUM TOKEN');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.warn('⚠️ ATENÇÃO: Nenhum token encontrado no localStorage/sessionStorage!');
      }
    }
    return headers;
  }

  private setCachedClientes(data: ClienteCompleto[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CLIENTES_CACHE_KEY, JSON.stringify(data));
  }

  private clearCache(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CLIENTES_CACHE_KEY);
  }

  getCached(): ClienteCompleto[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(CLIENTES_CACHE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private buildQueryParams(filters: FindAllFilters): string {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.ativo !== undefined) params.append('ativo', String(filters.ativo));
    if (filters.skip !== undefined) params.append('skip', String(filters.skip));
    if (filters.take !== undefined) params.append('take', String(filters.take));
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  async findAll(filters: FindAllFilters = {}, options?: { preferCache?: boolean; forceRefresh?: boolean }): Promise<ClienteCompleto[]> {
    const preferCache = options?.preferCache ?? true;
    const forceRefresh = options?.forceRefresh ?? false;

    try {
      // Cache pode ser usado quando não há busca, o filtro de ativo será aplicado no cliente
      const canUseCache = !filters.search;
      if (canUseCache && preferCache && !forceRefresh) {
        const cached = this.getCached();
        if (cached.length > 0) {
          // Aplicar filtro de ativo no cliente se necessário
          if (filters.ativo !== undefined) {
            return cached.filter((c: ClienteCompleto) => c.ativo === filters.ativo);
          }
          return cached;
        }
      }

      const queryString = this.buildQueryParams(filters);
      const headers = this.getAuthHeaders();
      const url = `${API_URL}/api/clientes${queryString}`;
      console.log('📤 Enviando requisição para:', url);
      console.log('📤 Headers:', { Authorization: headers['Authorization'] ? 'Bearer [...]' : 'VAZIO' });
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        console.error(`❌ Erro ${response.status} (${response.statusText}) ao buscar clientes`);
        const responseText = await response.text();
        console.error('Resposta do servidor:', responseText);
        throw new Error(`Erro ao buscar clientes: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Clientes carregados:', result);
      
      // Backend retorna {clientes, total} ou pode retornar {data, total} ou array direto
      const clientes = result.clientes || result.data || result;
      
      // Cachear quando não há busca
      if (!filters.search) {
        this.setCachedClientes(clientes);
      }
      
      return clientes;
    } catch (error) {
      // Usar cache como fallback se não houver busca
      if (!filters.search) {
        const cached = this.getCached();
        if (cached.length > 0) {
          // Aplicar filtro de ativo se necessário
          if (filters.ativo !== undefined) {
            return cached.filter((c: ClienteCompleto) => c.ativo === filters.ativo);
          }
          return cached;
        }
      }
      console.error('❌ Erro ao buscar clientes:', error);
      throw error;
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
      this.clearCache();
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
      this.clearCache();
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
      this.clearCache();
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar cliente:', error);
      return false;
    }
  }
}

export const clienteServiceAPI = new ClienteServiceAPI();
