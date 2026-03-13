const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type FinanceiroStatus = 'EM_ABERTO' | 'PAGO' | 'PARCIALMENTE_PAGO' | 'ATRASADO' | 'CANCELADO';

export type ContaReceber = {
  id: string;
  codigoFatura: string;
  status: FinanceiroStatus;
  cliente: string;
  cnpjCpf: string;
  dataEmissao: string;
  dataVencimento: string;
  diasAtraso: number;
  formaPagamento: string;
  valorBruto: number;
  desconto: number;
  valorLiquido: number;
  valorRecebido: number;
  saldoAberto: number;
  responsavel: string;
  observacoes: string;
};

export type ContaPagar = {
  id: string;
  codigoFatura: string;
  status: FinanceiroStatus;
  fornecedor: string;
  centroCusto: string;
  categoriaDespesa: string;
  dataEmissao: string;
  dataVencimento: string;
  diasAtraso: number;
  formaPagamento: string;
  valorBruto: number;
  desconto: number;
  valorLiquido: number;
  valorPago: number;
  saldoAberto: number;
  responsavel: string;
  observacoes: string;
};

export type ListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: FinanceiroStatus;
  formaPagamento?: string;
  minValor?: number;
  maxValor?: number;
  dataInicial?: string;
  dataFinal?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

class FinanceiroServiceAPI {
  private cache = new Map<string, { expiresAt: number; value: unknown }>();

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  private getHeaders(): Record<string, string> {
    const token = this.getToken();

    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private buildQuery(query?: Record<string, unknown>): string {
    if (!query) return '';
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      params.append(key, String(value));
    }

    const str = params.toString();
    return str ? `?${str}` : '';
  }

  private async parse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || `Erro HTTP ${response.status}`);
    }

    return response.json();
  }

  private async getWithCache<T>(url: string, ttlMs = 15000): Promise<T> {
    const token = this.getToken() || '';
    const cacheKey = `${token}::${url}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached.value as T;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const parsed = await this.parse<T>(response);
    this.cache.set(cacheKey, { value: parsed, expiresAt: now + ttlMs });
    return parsed;
  }

  private invalidateCache() {
    this.cache.clear();
  }

  async dashboard() {
    return this.getWithCache<any>(`${API_URL}/api/financeiro/dashboard`, 12000);
  }

  async contasReceber(query: ListQuery) {
    return this.getWithCache<{ data: ContaReceber[]; total: number }>(`${API_URL}/api/financeiro/contas-receber${this.buildQuery(query)}`, 10000);
  }

  async contasPagar(query: ListQuery) {
    return this.getWithCache<{ data: ContaPagar[]; total: number }>(`${API_URL}/api/financeiro/contas-pagar${this.buildQuery(query)}`, 10000);
  }

  async fluxoCaixa(query?: { dataInicial?: string; dataFinal?: string; categoria?: string; contaBancaria?: string }) {
    return this.getWithCache<any>(`${API_URL}/api/financeiro/fluxo-caixa${this.buildQuery(query)}`, 10000);
  }

  async relatorios(query: { tipo: string; dataInicial?: string; dataFinal?: string }) {
    return this.getWithCache<any>(`${API_URL}/api/financeiro/relatorios${this.buildQuery(query)}`, 10000);
  }

  async configuracoes() {
    return this.getWithCache<any>(`${API_URL}/api/financeiro/configuracoes`, 30000);
  }

  async criarFatura(payload: {
    tipo: 'RECEBER' | 'PAGAR';
    nome: string;
    documento?: string;
    dataEmissao: string;
    dataVencimento: string;
    formaPagamento: string;
    valorBruto: number;
    desconto?: number;
    responsavel?: string;
    observacoes?: string;
    categoria?: string;
    centroCusto?: string;
  }) {
    const response = await fetch(`${API_URL}/api/financeiro/faturas`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await this.parse<any>(response);
    this.invalidateCache();
    return result;
  }

  async registrarPagamento(payload: {
    tipo: 'RECEBER' | 'PAGAR';
    alvoId: string;
    valor: number;
    dataPagamento: string;
    formaPagamento: string;
    observacoes?: string;
    comprovanteUrl?: string;
  }) {
    const response = await fetch(`${API_URL}/api/financeiro/pagamentos`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await this.parse<any>(response);
    this.invalidateCache();
    return result;
  }

  async atualizarFatura(id: string, payload: Record<string, unknown>) {
    const response = await fetch(`${API_URL}/api/financeiro/faturas/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await this.parse<any>(response);
    this.invalidateCache();
    return result;
  }

  async deletarFatura(id: string) {
    const response = await fetch(`${API_URL}/api/financeiro/faturas/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || `Erro HTTP ${response.status}`);
    }

    this.invalidateCache();
  }

  async atualizarPagamento(id: string, payload: Record<string, unknown>) {
    const response = await fetch(`${API_URL}/api/financeiro/pagamentos/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await this.parse<any>(response);
    this.invalidateCache();
    return result;
  }

  toCurrency(value: number): string {
    return formatCurrency(value);
  }
}

export const financeiroServiceAPI = new FinanceiroServiceAPI();
