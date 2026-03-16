const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const EQUIPES_CACHE_KEY = 'cache_api_equipes_v1';

export interface EquipeAPI {
  id: string;
  nome: string;
  login: string;
  cpf?: string;
  funcao: string;
  telefone?: string;
  email?: string;
  estado?: string;
  comissaoAtiva: boolean;
  agencia?: string;
  contaCorrente?: string;
  banco?: string;
  meioPagamento?: string;
  cpfCnpjRecebimento?: string;
  tipoComissao?: string;
  valorComissao?: string;
  parceiroId: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  parceiro?: {
    id: string;
    nome: string;
  };
}

interface CreateEquipeData {
  nome: string;
  cpf?: string;
  funcao: string;
  telefone?: string;
  email?: string;
  estado?: string;
  comissaoAtiva?: boolean;
  agencia?: string;
  contaCorrente?: string;
  banco?: string;
  meioPagamento?: string;
  cpfCnpjRecebimento?: string;
  tipoComissao?: string;
  valorComissao?: string;
  parceiroId: string;
  ativo?: boolean;
}

interface UpdateEquipeData extends Partial<CreateEquipeData> {
  parceiroId?: never;
}

class EquipeServiceAPI {
  private authToken: string | null = null;

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  private setCachedEquipes(data: EquipeAPI[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(EQUIPES_CACHE_KEY, JSON.stringify(data));
  }

  private clearCache(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(EQUIPES_CACHE_KEY);
  }

  getCached(): EquipeAPI[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(EQUIPES_CACHE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async findAll(
    parceiroId?: string,
    funcao?: string,
    options?: { preferCache?: boolean; forceRefresh?: boolean }
  ): Promise<EquipeAPI[]> {
    const preferCache = options?.preferCache ?? true;
    const forceRefresh = options?.forceRefresh ?? false;

    try {
      if (parceiroId && !this.isUuid(parceiroId)) {
        console.warn('⚠️ parceiroId inválido para API de equipes, ignorando filtro legado:', parceiroId);
        return [];
      }

      const canUseSharedCache = !parceiroId && !funcao;
      if (canUseSharedCache && preferCache && !forceRefresh) {
        const cached = this.getCached();
        if (cached.length > 0) {
          return cached;
        }
      }

      const params = new URLSearchParams();
      if (parceiroId) params.append('parceiroId', parceiroId);
      if (funcao) params.append('funcao', funcao);

      const queryString = params.toString();
      const url = `${API_URL}/api/equipes${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, { headers: this.getAuthHeaders() });

      if (!response.ok) {
        throw new Error(`Erro ao buscar equipes (HTTP ${response.status})`);
      }

      const data = await response.json();
      const equipes = data.equipes || [];
      if (!parceiroId && !funcao) {
        this.setCachedEquipes(equipes);
      }
      return equipes;
    } catch (error) {
      if (!parceiroId && !funcao) {
        const cached = this.getCached();
        if (cached.length > 0) {
          return cached;
        }
      }
      console.error('❌ Erro ao buscar equipes:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<EquipeAPI> {
    try {
      const response = await fetch(`${API_URL}/api/equipes/${id}`, { 
        headers: this.getAuthHeaders() 
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar equipe (HTTP ${response.status})`);
      }

      const equipe = await response.json();
      return equipe;
    } catch (error) {
      console.error('❌ Erro ao buscar equipe:', error);
      throw error;
    }
  }

  async create(equipe: CreateEquipeData): Promise<EquipeAPI> {
    try {
      console.log('📤 Criando equipe via API...', equipe);

      const response = await fetch(`${API_URL}/api/equipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(equipe),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        
        // Se houver detalhes de validação, incluir na mensagem
        let message = errorBody?.error || `Erro ao criar equipe (HTTP ${response.status})`;
        if (errorBody?.details && Array.isArray(errorBody.details)) {
          const detalhes = errorBody.details
            .map((d: { path?: string[]; message?: string }) => `${d.path?.join('.')} - ${d.message}`)
            .join('; ');
          message = `${message}: ${detalhes}`;
          console.error('📋 Detalhes de validação:', errorBody.details);
        }
        
        throw new Error(message);
      }

      const novaEquipe = await response.json();
      this.clearCache();
      console.log('✅ Equipe criada no Supabase:', novaEquipe);
      return novaEquipe;
    } catch (error) {
      console.error('❌ Erro ao criar equipe:', error);
      throw error;
    }
  }

  async update(id: string, equipe: UpdateEquipeData): Promise<EquipeAPI> {
    try {
      console.log('📝 Atualizando equipe via API...', id, equipe);

      const response = await fetch(`${API_URL}/api/equipes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(equipe),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.error || `Erro ao atualizar equipe (HTTP ${response.status})`;
        throw new Error(message);
      }

      const equipeAtualizada = await response.json();
      this.clearCache();
      console.log('✅ Equipe atualizada:', equipeAtualizada);
      return equipeAtualizada;
    } catch (error) {
      console.error('❌ Erro ao atualizar equipe:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<{ message: string }> {
    try {
      console.log('🗑️ Deletando equipe via API...', id);

      const response = await fetch(`${API_URL}/api/equipes/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erro ao deletar equipe (HTTP ${response.status})`);
      }

      const result = await response.json();
      this.clearCache();
      console.log('✅ Equipe deletada:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao deletar equipe:', error);
      throw error;
    }
  }
}

export const equipeServiceAPI = new EquipeServiceAPI();
