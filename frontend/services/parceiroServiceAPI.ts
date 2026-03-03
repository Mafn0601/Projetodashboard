const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

class ParceiroServiceAPI {
  async findAll(): Promise<ParceiroAPI[]> {
    try {
      const headers: Record<string, string> = {};
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${API_URL}/api/parceiros`, { headers });

      if (!response.ok) {
        throw new Error(`Erro ao buscar parceiros (HTTP ${response.status})`);
      }

      const data = await response.json();
      return data.parceiros || [];
    } catch (error) {
      console.error('❌ Erro ao buscar parceiros:', error);
      throw error;
    }
  }

  async create(parceiro: CreateParceiroData): Promise<ParceiroAPI> {
    try {
      console.log('📤 Criando parceiro via API...', parceiro);

      const response = await fetch(`${API_URL}/api/parceiros`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parceiro),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.error || `Erro ao criar parceiro (HTTP ${response.status})`;
        throw new Error(message);
      }

      const novoParceiro = await response.json();
      console.log('✅ Parceiro criado no Supabase:', novoParceiro);
      return novoParceiro;
    } catch (error) {
      console.error('❌ Erro ao criar parceiro:', error);
      throw error;
    }
  }
}

export const parceiroServiceAPI = new ParceiroServiceAPI();
