const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface OrcamentoItemAPI {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface OrcamentoAPI {
  id: string;
  numeroOrcamento: string;
  clienteId: string;
  descricao?: string;
  valorTotal: number;
  desconto?: number;
  validade: string;
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'EXPIRADO';
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
  cliente?: {
    id: string;
    nome: string;
    telefone?: string;
    email?: string;
  };
  itens?: OrcamentoItemAPI[];
}

interface FindAllFilters {
  status?: string;
  clienteId?: string;
  skip?: number;
  take?: number;
}

interface CreateOrcamentoData {
  clienteId: string;
  descricao?: string;
  valorTotal: number;
  desconto?: number;
  validade: string;
  status?: 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'EXPIRADO';
  observacoes?: string;
  itens?: Array<{
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
  }>;
}

class OrcamentoServiceAPI {
  private authToken: string | null = null;

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  private getAuthHeaders(contentType: boolean = true): Record<string, string> {
    const headers: Record<string, string> = contentType ? { 'Content-Type': 'application/json' } : {};

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private buildQueryParams(filters: FindAllFilters): string {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.clienteId) params.append('clienteId', filters.clienteId);
    if (filters.skip !== undefined) params.append('skip', String(filters.skip));
    if (filters.take !== undefined) params.append('take', String(filters.take));

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  async findAll(filters: FindAllFilters = {}): Promise<OrcamentoAPI[]> {
    try {
      const response = await fetch(`${API_URL}/api/orcamentos${this.buildQueryParams(filters)}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar orçamentos (HTTP ${response.status})`);
      }

      const result = await response.json();
      return result.orcamentos || result.data || result;
    } catch (error) {
      console.error('❌ Erro ao buscar orçamentos:', error);
      return [];
    }
  }

  async findById(id: string): Promise<OrcamentoAPI | null> {
    try {
      const response = await fetch(`${API_URL}/api/orcamentos/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar orçamento (HTTP ${response.status})`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erro ao buscar orçamento:', error);
      return null;
    }
  }

  async create(payload: CreateOrcamentoData): Promise<OrcamentoAPI | null> {
    try {
      const response = await fetch(`${API_URL}/api/orcamentos`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || `Erro ao criar orçamento (HTTP ${response.status})`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erro ao criar orçamento:', error);
      return null;
    }
  }
}

export const orcamentoServiceAPI = new OrcamentoServiceAPI();
