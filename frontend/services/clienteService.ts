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
 * Tipo expandido de Cliente com todos os campos do novo formulário
 */
export type ClienteCompleto = {
  id: string;
  responsavel: string;
  parceiro: string;
  nome: string;
  nomeCliente?: string;
  email?: string;
  emailCliente?: string;
  cpfCnpj?: string;
  telefone: string;
  placaChassi: string;
  placa?: string;
  chassi?: string;
  tipoAgendamento: string;
  tipo: string;
  fabricante: string;
  modelo: string;
  cor?: string;
  dataAgendamento: string;
  horarioAgendamento?: string;
  descricaoServico?: string;
  formaPagamento?: string;
  meioPagamento?: string;
  origemPedido?: 'INTERNO' | 'EXTERNO';
  dataCriacao: string;
  dataAtualizacao: string;
};

const KEY = 'clientes';
const KEY_COMPLETO = 'clientesCompleto';

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

/**
 * Funções para ClienteCompleto (novo formulário expandido)
 */

export function getAllCompleto(): ClienteCompleto[] {
  return readArray<ClienteCompleto>(KEY_COMPLETO);
}

/**
 * Converte horário do formato hora_X para HH:mm
 */
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

/**
 * Obtém label do responsável
 */
function obterLabelResponsavel(respId: string | undefined): string {
  if (!respId) return 'Não informado';
  
  // Primeiro, tentar encontrar em mockResponsaveis
  const item = mockResponsaveis.find(r => r.value === respId);
  if (item) return item.label;
  
  // Se não encontrar, procurar em equipes (para novos responsáveis)
  try {
    const equipes = readArray<any>('equipes');
    const equipe = equipes.find(e => e.id === respId);
    if (equipe) return equipe.nome || equipe.login || respId;
  } catch (error) {
    // Se houver erro ao ler equipes, continuar
  }
  
  // Fallback: retornar o ID se não encontrar em nenhum lugar
  return respId;
}

/**
 * Obtém label do tipo de agendamento (busca de Tipo de OS)
 */
function obterLabelTipoAgendamento(tipoId: string | undefined): string {
  if (!tipoId) return 'Serviço Geral';
  const tiposOs = readArray<TipoOS>('tiposOs');
  const item = tiposOs.find(t => t.id === tipoId);
  return item ? item.nome : tipoId;
}

/**
 * Converte data do formato ISO para dd/mm
 * Usa timezone local para evitar problemas de shift de dia
 */
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
