/**
 * Veículo Service - API Integration
 * Comunicação com o backend via HTTP REST API
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Veiculo {
  id: string;
  clienteId: string;
  placa: string;
  chassi?: string;
  marca: string;
  modelo: string;
  fabricante?: string;
  anoFabricacao?: string;
  anoModelo?: string;
  cor?: string;
  combustivel?: string;
  createdAt: string;
  updatedAt: string;
}

interface FindAllFilters {
  clienteId?: string;
  placa?: string;
  search?: string;
  skip?: number;
  take?: number;
}

interface CreateVeiculoData {
  clienteId: string;
  placa: string;
  chassi?: string;
  marca: string;
  modelo: string;
  fabricante?: string;
  anoFabricacao?: string;
  anoModelo?: string;
  cor?: string;
  combustivel?: string;
}

class VeiculoServiceAPI {
  private buildQueryParams(filters: FindAllFilters): string {
    const params = new URLSearchParams();
    
    if (filters.clienteId) params.append('clienteId', filters.clienteId);
    if (filters.placa) params.append('placa', filters.placa);
    if (filters.search) params.append('search', filters.search);
    if (filters.skip !== undefined) params.append('skip', String(filters.skip));
    if (filters.take !== undefined) params.append('take', String(filters.take));
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  async findAll(filters: FindAllFilters = {}): Promise<Veiculo[]> {
    try {
      const queryString = this.buildQueryParams(filters);
      const response = await fetch(`${API_URL}/api/veiculos${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar veículos: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Veículos carregados:', result.veiculos?.length || result.length);
      
      return result.veiculos || result;
    } catch (error) {
      console.error('❌ Erro ao buscar veículos:', error);
      return [];
    }
  }

  async findById(id: string): Promise<Veiculo | null> {
    try {
      const response = await fetch(`${API_URL}/api/veiculos/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar veículo: ${response.statusText}`);
      }

      const veiculo = await response.json();
      console.log('✅ Veículo encontrado:', veiculo);
      return veiculo;
    } catch (error) {
      console.error('❌ Erro ao buscar veículo:', error);
      return null;
    }
  }

  async create(veiculo: CreateVeiculoData): Promise<Veiculo | null> {
    try {
      console.log('📤 Criando veículo via API...', veiculo);
      
      const response = await fetch(`${API_URL}/api/veiculos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(veiculo),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erro ao criar veículo: ${error.error || error.message}`);
      }

      const novoVeiculo = await response.json();
      console.log('✅ Veículo criado:', novoVeiculo);
      return novoVeiculo;
    } catch (error) {
      console.error('❌ Erro ao criar veículo:', error);
      return null;
    }
  }

  async update(id: string, veiculo: Partial<CreateVeiculoData>): Promise<Veiculo | null> {
    try {
      console.log('📤 Atualizando veículo:', id, veiculo);
      
      const response = await fetch(`${API_URL}/api/veiculos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(veiculo),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erro ao atualizar veículo: ${error.error || error.message}`);
      }

      const veiculoAtualizado = await response.json();
      console.log('✅ Veículo atualizado:', veiculoAtualizado);
      return veiculoAtualizado;
    } catch (error) {
      console.error('❌ Erro ao atualizar veículo:', error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      console.log('📤 Deletando veículo:', id);
      
      const response = await fetch(`${API_URL}/api/veiculos/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erro ao deletar veículo: ${error.error || error.message}`);
      }

      console.log('✅ Veículo deletado');
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar veículo:', error);
      return false;
    }
  }
}

export const veiculoServiceAPI = new VeiculoServiceAPI();
