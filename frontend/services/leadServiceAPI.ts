const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type LeadStatus = 'NOVO' | 'CONTATO_REALIZADO' | 'QUALIFICADO' | 'CONVERTIDO' | 'PERDIDO';

export interface LeadAPI {
  id: string;
  nome: string;
  telefone: string;
  email?: string | null;
  empresa?: string | null;
  cargo?: string | null;
  clienteId?: string | null;
  origem?: string | null;
  status: LeadStatus;
  score: number;
  ultimaInteracao?: string | null;
  emSequencia: boolean;
  observacoes?: string | null;
  responsavelId?: string | null;
  createdAt: string;
  updatedAt: string;
  cliente?: {
    id: string;
    nome: string;
    email?: string | null;
    telefone?: string | null;
  } | null;
  responsavel?: {
    id: string;
    nome: string;
    login: string;
    email?: string | null;
  } | null;
}

export interface LeadListFilters {
  search?: string;
  status?: LeadStatus;
  responsavelId?: string;
  mine?: boolean;
  minScore?: number;
  emSequencia?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  sortBy?: 'createdAt' | 'score' | 'ultimaInteracao' | 'nome';
  sortOrder?: 'asc' | 'desc';
  skip?: number;
  take?: number;
}

export interface LeadListResponse {
  leads: LeadAPI[];
  total: number;
}

export interface LeadSummary {
  totalLeads: number;
  activeLeads: number;
  averageScore: number;
  statusCounts: Array<{
    status: LeadStatus;
    total: number;
  }>;
}

export interface CreateLeadPayload {
  nome: string;
  telefone: string;
  email?: string;
  empresa?: string;
  cargo?: string;
  clienteId?: string;
  origem?: string;
  status?: LeadStatus;
  score?: number;
  ultimaInteracao?: string;
  emSequencia?: boolean;
  observacoes?: string;
  responsavelId?: string;
}

class LeadServiceAPI {
  private authToken: string | null = null;

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  private resolveToken(): string | null {
    if (this.authToken) return this.authToken;
    if (typeof window === 'undefined') return null;

    return sessionStorage.getItem('token') || localStorage.getItem('token');
  }

  private getHeaders(): Record<string, string> {
    const token = this.resolveToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private buildQueryParams(filters: LeadListFilters = {}): string {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.responsavelId) params.append('responsavelId', filters.responsavelId);
    if (filters.mine !== undefined) params.append('mine', String(filters.mine));
    if (filters.minScore !== undefined) params.append('minScore', String(filters.minScore));
    if (filters.emSequencia !== undefined) params.append('emSequencia', String(filters.emSequencia));
    if (filters.createdAfter) params.append('createdAfter', filters.createdAfter);
    if (filters.createdBefore) params.append('createdBefore', filters.createdBefore);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.skip !== undefined) params.append('skip', String(filters.skip));
    if (filters.take !== undefined) params.append('take', String(filters.take));

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error || `Erro HTTP ${response.status}`);
    }

    return response.json();
  }

  async findAll(filters: LeadListFilters = {}): Promise<LeadListResponse> {
    const response = await fetch(`${API_URL}/api/leads${this.buildQueryParams(filters)}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.parseResponse<LeadListResponse>(response);
  }

  async summary(filters: LeadListFilters = {}): Promise<LeadSummary> {
    const response = await fetch(`${API_URL}/api/leads/summary${this.buildQueryParams(filters)}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.parseResponse<LeadSummary>(response);
  }

  async create(payload: CreateLeadPayload): Promise<LeadAPI> {
    const response = await fetch(`${API_URL}/api/leads`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    return this.parseResponse<LeadAPI>(response);
  }

  async update(id: string, payload: Partial<CreateLeadPayload>): Promise<LeadAPI> {
    const response = await fetch(`${API_URL}/api/leads/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    return this.parseResponse<LeadAPI>(response);
  }

  async delete(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/leads/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    // Treat 404 as an idempotent delete: the lead is already gone.
    if (response.status === 404) {
      return { message: 'Lead já removido' };
    }

    return this.parseResponse<{ message: string }>(response);
  }
}

export const leadServiceAPI = new LeadServiceAPI();