/**
 * TipoOS Service - API Integration
 * Comunicação com o backend via HTTP REST API
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const TIPOS_OS_CACHE_KEY = 'cache_api_tipos_os_v1';

export interface TipoOSItem {
  id: string;
  tipoOSId: string;
  nome: string;
  tipo: 'SERVICO' | 'PRODUTO';
  preco: number;
  desconto: number;
  duracao?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TipoOS {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  itens: TipoOSItem[];
}

class TipoOSServiceAPI {
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private setCachedTiposOS(data: TipoOS[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TIPOS_OS_CACHE_KEY, JSON.stringify(data));
  }

  private clearCache(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TIPOS_OS_CACHE_KEY);
  }

  getCached(): TipoOS[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(TIPOS_OS_CACHE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async findAll(options?: { preferCache?: boolean; forceRefresh?: boolean }): Promise<TipoOS[]> {
    const preferCache = options?.preferCache ?? true;
    const forceRefresh = options?.forceRefresh ?? false;

    try {
      if (preferCache && !forceRefresh) {
        const cached = this.getCached();
        if (cached.length > 0) {
          return cached;
        }
      }

      const response = await fetch(`${API_URL}/api/tipos-os`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar tipos de OS: ${response.statusText}`);
      }

      const result = await response.json();
      this.setCachedTiposOS(result);
      return result;
    } catch (error) {
      const cached = this.getCached();
      if (cached.length > 0) {
        return cached;
      }
      console.error('❌ Erro ao buscar tipos de OS:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<TipoOS | null> {
    try {
      const response = await fetch(`${API_URL}/api/tipos-os/${id}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Erro ao buscar tipo de OS: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erro ao buscar tipo de OS:', error);
      return null;
    }
  }

  async create(data: { nome: string; descricao?: string }): Promise<TipoOS> {
    try {
      const response = await fetch(`${API_URL}/api/tipos-os`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar tipo de OS');
      }

      this.clearCache();
      return await response.json();
    } catch (error: any) {
      console.error('❌ Erro ao criar tipo de OS:', error);
      throw new Error(`Erro ao criar tipo de OS: ${error.message}`);
    }
  }

  async update(id: string, data: { nome?: string; descricao?: string }): Promise<TipoOS> {
    try {
      const response = await fetch(`${API_URL}/api/tipos-os/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar tipo de OS');
      }

      this.clearCache();
      return await response.json();
    } catch (error: any) {
      console.error('❌ Erro ao atualizar tipo de OS:', error);
      throw new Error(`Erro ao atualizar tipo de OS: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/tipos-os/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao deletar tipo de OS');
      }

      this.clearCache();
    } catch (error: any) {
      console.error('❌ Erro ao deletar tipo de OS:', error);
      throw new Error(`Erro ao deletar tipo de OS: ${error.message}`);
    }
  }

  // ==================== ITENS ====================

  async createItem(data: {
    tipoOSId: string;
    nome: string;
    tipo: 'SERVICO' | 'PRODUTO';
    preco: number;
    desconto?: number;
    duracao?: number;
  }): Promise<TipoOSItem> {
    try {
      const response = await fetch(`${API_URL}/api/tipos-os/itens`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar item');
      }

      this.clearCache();
      return await response.json();
    } catch (error: any) {
      console.error('❌ Erro ao criar item:', error);
      throw new Error(`Erro ao criar item: ${error.message}`);
    }
  }

  async updateItem(
    id: string,
    data: {
      nome?: string;
      tipo?: 'SERVICO' | 'PRODUTO';
      preco?: number;
      desconto?: number;
      duracao?: number;
    }
  ): Promise<TipoOSItem> {
    try {
      const response = await fetch(`${API_URL}/api/tipos-os/itens/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar item');
      }

      this.clearCache();
      return await response.json();
    } catch (error: any) {
      console.error('❌ Erro ao atualizar item:', error);
      throw new Error(`Erro ao atualizar item: ${error.message}`);
    }
  }

  async deleteItem(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/tipos-os/itens/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao deletar item');
      }

      this.clearCache();
    } catch (error: any) {
      console.error('❌ Erro ao deletar item:', error);
      throw new Error(`Erro ao deletar item: ${error.message}`);
    }
  }
}

export default new TipoOSServiceAPI();
