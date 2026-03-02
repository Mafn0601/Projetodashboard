const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ParceiroAPI {
  id: string;
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
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
  ativo?: boolean;
}

class ParceiroServiceAPI {
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
