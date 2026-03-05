import { readArray, appendItem, updateItemById, writeArray } from '@/lib/storage';
import { addAgendamento } from './agendaService';
import { formatDate, getBrasiliaNow, getBrasiliaYear } from '@/lib/dateUtils';
import {
  mockResponsaveis,
  mockFabricantes,
  mockModelos,
} from '@/lib/mockFormData';

type TipoOS = {
  id: string;
  nome: string;
  [key: string]: unknown;
};

/**
 * Tipo básico de Cliente (compatível com versão anterior)
 */
export type Cliente = {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  parceiro?: string;
  responsavel?: string;
};

/**
 * Tipo expandido de Cliente - reflete o schema do banco de dados
 * Campos retornados pela API do backend
 */
export type ClienteCompleto = {
  id: string;
  nome: string;
  email?: string;
  telefone: string;
  cpfCnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  ativo?: boolean;
  createdAt?: string;
  updatedAt?: string;
  
  // Relações do Prisma
  veiculos?: Array<{
    id: string;
    placa: string;
    chassi?: string;
    marca: string;
    modelo: string;
    fabricante?: string;
    anoFabricacao?: string;
    anoModelo?: string;
    cor?: string;
    combustivel?: string;
    [key: string]: unknown;
  }>;
  _count?: {
    agendamentos?: number;
    ordensServico?: number;
  };
  
  // Campos legados (deprecados - manter para compatibilidade)
  nomeCliente?: string;
  emailCliente?: string;
  responsavel?: string;
  parceiro?: string;
  placaChassi?: string;
  placa?: string;
  chassi?: string;
  tipoAgendamento?: string;
  tipo?: string;
  fabricante?: string;
  modelo?: string;
  cor?: string;
  dataAgendamento?: string;
  horarioAgendamento?: string;
  boxId?: string;
  descricaoServico?: string;
  formaPagamento?: string;
  meioPagamento?: string;
  origemPedido?: 'INTERNO' | 'EXTERNO';
  dataCriacao?: string;
  dataAtualizacao?: string;
};

const KEY = 'clientes';
const KEY_COMPLETO = 'clientesCompleto';

// funções básicas de CRUD pra clientes
export function getAll(): Cliente[] {
  return readArray<Cliente>(KEY);
}

export function save(cliente: Cliente): Cliente[] {
  return appendItem<Cliente>(KEY, cliente);
}

export function update(id: string, data: Partial<Cliente>): Cliente[] {
  return updateItemById<Cliente>(KEY, id, (item) => ({ ...item, ...data }));
}

export function remove(id: string): Cliente[] {
  const current = readArray<Cliente>(KEY);
  const next = current.filter((c) => c.id !== id);
  writeArray<Cliente>(KEY, next);
  return next;
}

// funções pro formulário expandido de cliente
export function getAllCompleto(): ClienteCompleto[] {
  return readArray<ClienteCompleto>(KEY_COMPLETO);
}

// converte formato hora_X pra HH:mm
function formatarHorario(horario: string | undefined): string {
  if (!horario) return '09:00';
  
  const match = horario.match(/hora_(\d+)/);
  if (match && match[1]) {
    const hora = parseInt(match[1], 10);
    return `${String(hora).padStart(2, '0')}:00`;
  }
  
  const timeMatch = horario.match(/\d{2}:\d{2}/);
  if (timeMatch) return timeMatch[0];
  
  return horario;
}

// pega o nome do responsável
function obterLabelResponsavel(respId: string | undefined): string {
  if (!respId) return 'Não informado';
  
  // tenta achar em mockResponsaveis primeiro
  const item = mockResponsaveis.find(r => r.value === respId);
  if (item) return item.label;
  
  // se não achar, procura em equipes
  try {
    const equipes = readArray<any>('equipes');
    const equipe = equipes.find(e => e.id === respId);
    if (equipe) return equipe.nome || equipe.login || respId;
  } catch (error) {
    // ignora se der erro ao ler equipes
  }
  
  // se não encontrou nada, retorna o ID mesmo
  return respId;
}

// busca o nome do tipo de OS
function obterLabelTipoAgendamento(tipoId: string | undefined): string {
  if (!tipoId) return 'Serviço Geral';
  const tiposOs = readArray<TipoOS>('tiposOs');
  const item = tiposOs.find(t => t.id === tipoId);
  return item ? item.nome : tipoId;
}

// converte data ISO pra dd/mm (cuida do timezone local)
function formatarDataAgendamento(data: string | undefined): string {
  if (!data) return formatDate(getBrasiliaNow());
  
  // Formato YYYY-MM-DD - criar Date com timezone local
  const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(data);
  if (dateOnlyMatch) {
    const [year, month, day] = data.split('-');
    // Criar data local (não UTC) para evitar shift de timezone
    const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return formatDate(localDate);
  }
  
  // Tentar parsear como data ISO completa
  const parsed = new Date(data);
  if (!isNaN(parsed.getTime())) {
    return formatDate(parsed);
  }
  
  // Fallback: data atual
  return formatDate(getBrasiliaNow());
}

/**
 * Cria título do agendamento baseado no veículo
 */
function criarTituloAgendamento(cliente: ClienteCompleto): string {
  // Pegar nome do fabricante
  const fabricanteObj = mockFabricantes.find(f => f.value === cliente.fabricante);
  const fabricanteNome = fabricanteObj?.label.toUpperCase() || 'VEÍCULO';
  
  // Pegar nome do modelo
  let modeloNome = 'DESCONHECIDO';
  if (cliente.fabricante && cliente.modelo && mockModelos[cliente.fabricante]) {
    const modeloObj = mockModelos[cliente.fabricante].find(m => m.value === cliente.modelo);
    modeloNome = modeloObj?.label.toUpperCase() || cliente.modelo.toUpperCase();
  }
  
  // Número sequencial baseado no ano (2 dígitos)
  // Tentar extrair do dataAgendamento, senão usar ano atual
  let numero = String(getBrasiliaYear()).slice(-2);
  
  if (cliente.dataAgendamento) {
    // Se for formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(cliente.dataAgendamento)) {
      numero = cliente.dataAgendamento.slice(2, 4);
    } else if (/^(\d{1,2})\/(\d{1,2})$/.test(cliente.dataAgendamento)) {
      // Se for formato dd/mm, usar ano atual
      numero = String(getBrasiliaYear()).slice(-2);
    }
  }
  
  return `${numero} ${fabricanteNome} - ${modeloNome}`;
}

/**
 * Salva cliente e cria agendamento automaticamente
 */
export function saveCompleto(cliente: ClienteCompleto): ClienteCompleto[] {
  const resultado = appendItem<ClienteCompleto>(KEY_COMPLETO, cliente);
  
  // Se tem agendamento, criar card na agenda
  if (cliente.dataAgendamento && cliente.horarioAgendamento) {
    try {
      // Usa a origem do pedido informada pelo cliente (INTERNO ou EXTERNO da loja)
      const tipoTag: "INTERNO" | "EXTERNO" = cliente.origemPedido || 'EXTERNO';
      
      addAgendamento({
        titulo: criarTituloAgendamento(cliente),
        placa: cliente.placaChassi || cliente.placa || 'SEM-PLACA',
        responsavel: obterLabelResponsavel(cliente.responsavel),
        cliente: cliente.nomeCliente || cliente.nome || 'Cliente sem nome',
        telefone: cliente.telefone || '(00) 00000-0000',
        tipo: obterLabelTipoAgendamento(cliente.tipoAgendamento),
        tag: tipoTag,
        horario: formatarHorario(cliente.horarioAgendamento),
        data: formatarDataAgendamento(cliente.dataAgendamento),
        clienteId: cliente.id,
          formaPagamento: cliente.formaPagamento,
          meioPagamento: cliente.meioPagamento,
      });
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
    }
  }
  
  return resultado;
}

export function updateCompleto(id: string, data: Partial<ClienteCompleto>): ClienteCompleto[] {
  const resultado = updateItemById<ClienteCompleto>(KEY_COMPLETO, id, (item) => ({ 
    ...item, 
    ...data,
    dataAtualizacao: new Date().toISOString()
  }));
  
  // Atualizar agendamento se houver mudanças relevantes
  const clienteAtualizado = resultado.find(c => c.id === id);
  if (clienteAtualizado) {
    try {
      // Importar updateAgendamentoByClienteId do agendaService
      const { updateAgendamentoByClienteId } = require('./agendaService');
      
      // Usa a origem do pedido informada pelo cliente (INTERNO ou EXTERNO da loja)
      const tipoTag: "INTERNO" | "EXTERNO" = clienteAtualizado.origemPedido || 'EXTERNO';
      
      updateAgendamentoByClienteId(id, {
        titulo: criarTituloAgendamento(clienteAtualizado),
        placa: clienteAtualizado.placaChassi || clienteAtualizado.placa || 'SEM-PLACA',
        responsavel: obterLabelResponsavel(clienteAtualizado.responsavel),
        cliente: clienteAtualizado.nomeCliente || clienteAtualizado.nome || 'Cliente sem nome',
        telefone: clienteAtualizado.telefone || '(00) 00000-0000',
        tipo: obterLabelTipoAgendamento(clienteAtualizado.tipoAgendamento),
        tag: tipoTag,
        horario: formatarHorario(clienteAtualizado.horarioAgendamento),
        data: formatarDataAgendamento(clienteAtualizado.dataAgendamento),
      });
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
    }
  }
  
  return resultado;
}

export function removeCompleto(id: string): ClienteCompleto[] {
  const current = readArray<ClienteCompleto>(KEY_COMPLETO);
  const next = current.filter((c) => c.id !== id);
  writeArray<ClienteCompleto>(KEY_COMPLETO, next);
  return next;
}
