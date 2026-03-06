/**
 * Status Card Service API
 * Cliente HTTP para Status Card REST API
 */

export interface StatusCardAPI {
  id: string;
  numero: string;
  veiculo: string;
  dataAgendamento: string;
  dataEntrega: string;
  cliente: string;
  parceiro: string;
  responsavel: string;
  status: 'recebido' | 'execucao' | 'finalizados' | 'entregue';
  boxId?: string;
  boxNome?: string;
  agendamentoId?: string;
  horaInicio?: string;
  horaFim?: string;
  formaPagamento?: string;
  meioPagamento?: string;
  timestampFinalizacao?: string;
  createdAt: string;
  updatedAt: string;
}

class StatusCardService {
  private baseURL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/status`;

  private getHeaders() {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || sessionStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async findAll(filters?: { status?: string }): Promise<StatusCardAPI[]> {
    try {
      let url = this.baseURL;
      if (filters?.status) {
        url = `${this.baseURL}/status/${filters.status}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar status cards:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<StatusCardAPI> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro ao buscar status card ${id}:`, error);
      throw error;
    }
  }

  async create(data: {
    id?: string;
    numero: string;
    veiculo: string;
    dataAgendamento: string;
    dataEntrega: string;
    cliente: string;
    parceiro: string;
    responsavel: string;
    status?: string;
    boxId?: string;
    boxNome?: string;
    agendamentoId?: string;
    horaInicio?: string;
    horaFim?: string;
    formaPagamento?: string;
    meioPagamento?: string;
  }): Promise<StatusCardAPI> {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao criar status card:', error);
      throw error;
    }
  }

  async update(
    id: string,
    data: {
      numero?: string;
      veiculo?: string;
      dataAgendamento?: string;
      dataEntrega?: string;
      cliente?: string;
      parceiro?: string;
      responsavel?: string;
      status?: string;
      boxId?: string;
      boxNome?: string;
      horaInicio?: string;
      horaFim?: string;
      formaPagamento?: string;
      meioPagamento?: string;
    }
  ): Promise<StatusCardAPI> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro ao atualizar status card ${id}:`, error);
      throw error;
    }
  }

  async moveCard(id: string, status: string): Promise<StatusCardAPI> {
    try {
      const response = await fetch(`${this.baseURL}/${id}/move`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro ao mover status card ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(`Erro ao deletar status card ${id}:`, error);
      throw error;
    }
  }
}

export default new StatusCardService();
