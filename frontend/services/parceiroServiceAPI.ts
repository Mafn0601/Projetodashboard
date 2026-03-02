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
  async create(parceiro: CreateParceiroData): Promise<ParceiroAPI | null> {
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
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar parceiro');
      }

      const novoParceiro = await response.json();
      console.log('✅ Parceiro criado no Supabase:', novoParceiro);
      return novoParceiro;
    } catch (error) {
      console.error('❌ Erro ao criar parceiro:', error);
      return null;
    }
  }
}

export const parceiroServiceAPI = new ParceiroServiceAPI();
