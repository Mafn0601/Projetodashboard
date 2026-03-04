const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface EquipeAPI {
  id: string;
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
  login: string;
  senha: string;
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
  async findAll(parceiroId?: string, funcao?: string): Promise<EquipeAPI[]> {
    try {
      const params = new URLSearchParams();
      if (parceiroId) params.append('parceiroId', parceiroId);
      if (funcao) params.append('funcao', funcao);

      const queryString = params.toString();
      const url = `${API_URL}/api/equipes${queryString ? `?${queryString}` : ''}`;

      const headers: Record<string, string> = {};
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Erro ao buscar equipes (HTTP ${response.status})`);
      }

      const data = await response.json();
      return data.equipes || [];
    } catch (error) {
      console.error('❌ Erro ao buscar equipes:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<EquipeAPI> {
    try {
      const headers: Record<string, string> = {};
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${API_URL}/api/equipes/${id}`, { headers });

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

      const response = await fetch(`${API_URL}/api/equipes`, {
        method: 'POST',
        headers,
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

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${API_URL}/api/equipes/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(equipe),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.error || `Erro ao atualizar equipe (HTTP ${response.status})`;
        throw new Error(message);
      }

      const equipeAtualizada = await response.json();
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

      const headers: Record<string, string> = {};
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${API_URL}/api/equipes/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Erro ao deletar equipe (HTTP ${response.status})`);
      }

      const result = await response.json();
      console.log('✅ Equipe deletada:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao deletar equipe:', error);
      throw error;
    }
  }
}

export const equipeServiceAPI = new EquipeServiceAPI();
