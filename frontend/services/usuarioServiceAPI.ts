const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type UsuarioRole = 'ADMIN' | 'GERENTE' | 'OPERADOR' | 'PARCEIRO';

export interface UsuarioAPI {
  id: string;
  nome: string;
  login: string;
  email: string;
  role: UsuarioRole;
  ativo: boolean;
  parceiroId?: string;
  parceiro?: {
    id: string;
    nome: string;
  };
  createdAt: string;
}

interface CreateUsuarioData {
  nome: string;
  login: string;
  email: string;
  senha: string;
  role: UsuarioRole;
  parceiroId?: string;
}

class UsuarioServiceAPI {
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

  async findAll(): Promise<UsuarioAPI[]> {
    const response = await fetch(`${API_URL}/api/auth/users`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error || `Erro ao buscar usuários (HTTP ${response.status})`);
    }

    return response.json();
  }

  async create(data: CreateUsuarioData): Promise<UsuarioAPI> {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error || `Erro ao criar usuário (HTTP ${response.status})`);
    }

    const payload = await response.json();
    return payload.usuario as UsuarioAPI;
  }
}

export const usuarioServiceAPI = new UsuarioServiceAPI();
