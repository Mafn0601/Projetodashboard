/**
 * Box Service - API Integration
 * Comunicação com o backend via HTTP REST API
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async findAll(filters?: FindAllFilters): Promise<BoxAPI[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/boxes`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const boxes = await response.json();

      // Aplicar filtros no client-side se necessário
      if (filters?.ativo !== undefined) {
        return boxes.filter((box: BoxAPI) => box.ativo === filters.ativo);
      }

      return boxes;
    } catch (error) {
      console.error('Erro ao buscar boxes:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<BoxAPI> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/boxes/${id}`, {
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
      const response = await fetch(`${API_URL}/boxes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
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
      const response = await fetch(`${API_URL}/boxes/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar box:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/boxes/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao deletar box:', error);
      throw error;
    }
  }
}

export default new BoxServiceAPI();
