/**
 * Box Service - API Integration
 * Comunicação com o backend via HTTP REST API
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const BOXES_CACHE_KEY = 'cache_api_boxes_v1';

export interface BoxAPI {
  id: string;
  numero: string;
  nome: string;
  descricao?: string;
  tipo?: string; // "lavagem" | "servico_geral"
  parceiroId?: string;
  parceiro?: string;
  cor?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FindAllFilters {
  ativo?: boolean;
}

class BoxServiceAPI {
  private authToken: string | null = null;

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  private resolveToken(): string | null {
    if (this.authToken) return this.authToken;
    if (typeof window === 'undefined') return null;

    return sessionStorage.getItem('token') || localStorage.getItem('token');
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.resolveToken();

    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private setCachedBoxes(data: BoxAPI[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(BOXES_CACHE_KEY, JSON.stringify(data));
  }

  private clearCache(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(BOXES_CACHE_KEY);
  }

  getCached(): BoxAPI[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(BOXES_CACHE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async findAll(filters?: FindAllFilters, options?: { preferCache?: boolean; forceRefresh?: boolean }): Promise<BoxAPI[]> {
    const preferCache = options?.preferCache ?? true;
    const forceRefresh = options?.forceRefresh ?? false;
    // Cache pode ser usado quando não há filtro de busca (todos os dados podem ser cacheados)
    // O filtro de ativo será aplicado no lado do cliente
    const canUseCache = true;

    try {
      // Se preferir cache e não forçar refresh, retornar cache imediatamente
      if (canUseCache && preferCache && !forceRefresh) {
        const cached = this.getCached();
        if (cached.length > 0) {
          console.log('✅ Boxes carregados do cache:', cached.length);
          // Aplicar filtros no cache
          if (filters?.ativo !== undefined) {
            return cached.filter((box: BoxAPI) => box.ativo === filters.ativo);
          }
          return cached;
        }
      }

      const headers = this.getAuthHeaders();
      const response = await fetch(`${API_URL}/api/boxes`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const boxes = await response.json();
      console.log('✅ Boxes carregados da API:', boxes.length);

      // Salvar no cache
      this.setCachedBoxes(boxes);

      // Aplicar filtros no client-side se necessário
      if (filters?.ativo !== undefined) {
        return boxes.filter((box: BoxAPI) => box.ativo === filters.ativo);
      }

      return boxes;
    } catch (error) {
      console.error('Erro ao buscar boxes:', error);
      
      // Fallback para cache em caso de erro
      const cached = this.getCached();
      if (cached.length > 0) {
        console.log('⚠️ Usando cache como fallback:', cached.length);
        if (filters?.ativo !== undefined) {
          return cached.filter((box: BoxAPI) => box.ativo === filters.ativo);
        }
        return cached;
      }
      
      throw error;
    }
  }

  async findById(id: string): Promise<BoxAPI> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/api/boxes/${id}`, {
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Box não encontrado');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar box:', error);
      throw error;
    }
  }

  async create(data: {
    numero: string;
    nome: string;
    descricao?: string;
    tipo?: string;
    parceiroId?: string;
    parceiro?: string;
    cor?: string;
    ativo?: boolean;
  }): Promise<BoxAPI> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/api/boxes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Limpar cache após criar
      this.clearCache();
      
      return result;
    } catch (error) {
      console.error('Erro ao criar box:', error);
      throw error;
    }
  }

  async update(
    id: string,
    data: {
      numero?: string;
      nome?: string;
      descricao?: string;
      tipo?: string;
      parceiroId?: string;
      parceiro?: string;
      cor?: string;
      ativo?: boolean;
    }
  ): Promise<BoxAPI> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/api/boxes/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Limpar cache após atualizar
      this.clearCache();
      
      return result;
    } catch (error) {
      console.error('Erro ao atualizar box:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/api/boxes/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }
      
      // Limpar cache após deletar
      this.clearCache();
    } catch (error) {
      console.error('Erro ao deletar box:', error);
      throw error;
    }
  }
}

export default new BoxServiceAPI();
