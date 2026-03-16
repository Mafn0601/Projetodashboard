const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const PARCEIROS_CACHE_KEY = 'cache_api_parceiros_v1';

export interface ParceiroAPI {
  id: string;
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateParceiroData {
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  ativo?: boolean;
}

interface UpdateParceiroData extends Partial<CreateParceiroData> {}

class ParceiroServiceAPI {
  private authToken: string | null = null;

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  private resolveToken(): string | null {
    if (this.authToken) return this.authToken;
    if (typeof window === 'undefined') return null;

    return sessionStorage.getItem('token') || localStorage.getItem('token');
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    const token = this.resolveToken();

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private setCachedParceiros(data: ParceiroAPI[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PARCEIROS_CACHE_KEY, JSON.stringify(data));
  }

  private clearCache(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PARCEIROS_CACHE_KEY);
  }

  getCached(): ParceiroAPI[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(PARCEIROS_CACHE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async findAll(options?: { preferCache?: boolean; forceRefresh?: boolean }): Promise<ParceiroAPI[]> {
    const preferCache = options?.preferCache ?? true;
    const forceRefresh = options?.forceRefresh ?? false;

    try {
      if (preferCache && !forceRefresh) {
        const cached = this.getCached();
        if (cached.length > 0) {
          return cached;
        }
      }

      const response = await fetch(`${API_URL}/api/parceiros`, { headers: this.getAuthHeaders() });

      if (!response.ok) {
        throw new Error(`Erro ao buscar parceiros (HTTP ${response.status})`);
      }

      const data = await response.json();
      const parceiros = data.parceiros || [];
      this.setCachedParceiros(parceiros);
      return parceiros;
    } catch (error) {
      const cached = this.getCached();
      if (cached.length > 0) {
        return cached;
      }
      console.error('❌ Erro ao buscar parceiros:', error);
      throw error;
    }
  }

  async create(parceiro: CreateParceiroData): Promise<ParceiroAPI> {
    try {
      const response = await fetch(`${API_URL}/api/parceiros`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(parceiro),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.error || `Erro ao criar parceiro (HTTP ${response.status})`;
        throw new Error(message);
      }

      const novoParceiro = await response.json();
      this.clearCache();
      return novoParceiro;
    } catch (error) {
      console.error('❌ Erro ao criar parceiro:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<ParceiroAPI | null> {
    try {
      const response = await fetch(`${API_URL}/api/parceiros/${id}`, { headers: this.getAuthHeaders() });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Erro ao buscar parceiro (HTTP ${response.status})`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erro ao buscar parceiro por ID:', error);
      throw error;
    }
  }

  async update(id: string, parceiro: UpdateParceiroData): Promise<ParceiroAPI | null> {
    try {
      const response = await fetch(`${API_URL}/api/parceiros/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(parceiro),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.error || `Erro ao atualizar parceiro (HTTP ${response.status})`;
        throw new Error(message);
      }

      const parceiroAtualizado = await response.json();
      this.clearCache();
      return parceiroAtualizado;
    } catch (error) {
      console.error('❌ Erro ao atualizar parceiro:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<{ message: string } | null> {
    try {
      const response = await fetch(`${API_URL}/api/parceiros/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.error || `Erro ao deletar parceiro (HTTP ${response.status})`;
        throw new Error(message);
      }

      const result = await response.json();
      this.clearCache();
      return result;
    } catch (error) {
      console.error('❌ Erro ao deletar parceiro:', error);
      throw error;
    }
  }
}

export const parceiroServiceAPI = new ParceiroServiceAPI();
