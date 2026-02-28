/**
 * Serviço de Agenda
 * Fornece dados de agendamentos para a tela de agenda
 * Preparado para futura integração com backend
 */

import { formatDate, getBrasiliaNow } from "@/lib/dateUtils";
import { readArray, writeArray } from "@/lib/storage";
import { syncOcupacaoFromAgendamento, removeOcupacaoByAgendamentoId, autoAlocateBox } from "./boxService";

export interface AgendaItem {
  id: string;
  titulo: string; // ex: "15 BYD - DOLPHIN"
  placa: string; // ex: "ABC-1234"
  responsavel: string;
  cliente: string;
  telefone: string;
  tipo: string; // ex: "Revisão", "Reparo"
  tag: "INTERNO" | "EXTERNO";
  horario: string; // formato HH:mm
  data: string; // formato dd/mm (será usado para agrupar)
  boxId?: string; // ID do box alocado
  boxNome?: string; // Nome do box para exibição
  duracaoEstimada?: number; // Duração em minutos
  clienteId?: string; // ID do cliente que originou este agendamento
    formaPagamento?: string; // ex: "A VISTA", "2 VEZES", etc
    meioPagamento?: string; // ex: "PIX", "CARTÃO CRÉDITO", etc
}

const AGENDA_STORAGE_KEY = "agendamentos";

// Dados iniciais de agendamentos
const defaultAgendamentos: AgendaItem[] = [
  // Hoje (27/02 - 17:00) - apenas horários após 17:00
  {
    id: "1",
    titulo: "15 BYD - DOLPHIN",
    placa: "ABC-1234",
    responsavel: "Maria Santos",
    cliente: "João Silva",
    telefone: "(11) 98765-4321",
    tipo: "Revisão",
    tag: "EXTERNO",
    horario: "18:00",
    data: formatDate(getDateOffset(0)),
    duracaoEstimada: 90,
  },
  {
    id: "2",
    titulo: "18 TOYOTA - COROLLA",
    placa: "XYZ-5678",
    responsavel: "Carlos Mendes",
    cliente: "Pedro Oliveira",
    telefone: "(11) 99876-5432",
    tipo: "Reparo",
    tag: "INTERNO",
    horario: "19:30",
    data: formatDate(getDateOffset(0)),
    duracaoEstimada: 120,
  },

  // Amanhã (28/02) - horários normais
  {
    id: "3",
    titulo: "20 HONDA - CIVIC",
    placa: "DEF-9012",
    responsavel: "Patricia Lima",
    cliente: "Ana Costa",
    telefone: "(21) 91234-5678",
    tipo: "Manutenção",
    tag: "EXTERNO",
    horario: "08:00",
    data: formatDate(getDateOffset(1)),
    duracaoEstimada: 60,
  },
  {
    id: "12",
    titulo: "⭐ EXEMPLO - VW GOL",
    placa: "EXM-9999",
    responsavel: "Seu Nome Aqui",
    cliente: "Cliente Exemplo",
    telefone: "(00) 00000-0000",
    tipo: "Exemplo",
    tag: "INTERNO",
    horario: "14:00",
    data: formatDate(getDateOffset(1)),
  },

  // Sexta (01/03)
  {
    id: "4",
    titulo: "12 VW - GOL",
    placa: "GHI-3456",
    responsavel: "Roberto Alves",
    cliente: "União Viagens",
    telefone: "(31) 98765-0123",
    tipo: "Alinhamento",
    tag: "INTERNO",
    horario: "10:00",
    data: formatDate(getDateOffset(2)),
  },
  {
    id: "5",
    titulo: "22 CHEVROLET - ONIX",
    placa: "JKL-7890",
    responsavel: "Fernanda Costa",
    cliente: "Empresa XYZ",
    telefone: "(41) 99876-1234",
    tipo: "Pintura",
    tag: "EXTERNO",
    horario: "13:30",
    data: formatDate(getDateOffset(2)),
  },

  // Sábado (02/03)
  {
    id: "6",
    titulo: "25 FIAT - ARGO",
    placa: "MNO-2345",
    responsavel: "Wagner Silva",
    cliente: "Márcia Dias",
    telefone: "(51) 91234-6789",
    tipo: "Revisão",
    tag: "INTERNO",
    horario: "08:30",
    data: formatDate(getDateOffset(3)),
  },

  // Domingo (03/03)
  {
    id: "7",
    titulo: "30 HYUNDAI - HB20",
    placa: "PQR-6789",
    responsavel: "Beatriz Ferreira",
    cliente: "Hugo Martins",
    telefone: "(61) 98765-2345",
    tipo: "Reparo",
    tag: "EXTERNO",
    horario: "09:00",
    data: formatDate(getDateOffset(3)),
  },
  {
    id: "8",
    titulo: "28 RENAULT - KWID",
    placa: "STU-0123",
    responsavel: "Diego Santos",
    cliente: "Lucia Pereira",
    telefone: "(85) 99876-6789",
    tipo: "Manutenção",
    tag: "INTERNO",
    horario: "15:00",
    data: formatDate(getDateOffset(3)),
  },

  // Segunda (04/03 - próxima semana)
  {
    id: "9",
    titulo: "16 NISSAN - MARCH",
    placa: "VWX-4567",
    responsavel: "Sophia Oliveira",
    cliente: "Transport Brasil",
    telefone: "(71) 91234-0123",
    tipo: "Alinhamento",
    tag: "EXTERNO",
    horario: "10:30",
    data: formatDate(getDateOffset(4)),
  },

  // Terça (05/03)
  {
    id: "10",
    titulo: "24 PEUGEOT - 208",
    placa: "YZA-8901",
    responsavel: "Lucas Ribeiro",
    cliente: "Gustavo Ferraz",
    telefone: "(81) 98765-3456",
    tipo: "Pintura",
    tag: "INTERNO",
    horario: "14:00",
    data: formatDate(getDateOffset(5)),
  },

  // Quarta (06/03)
  {
    id: "11",
    titulo: "32 SUZUKI - VITARA",
    placa: "BCD-2345",
    responsavel: "Amanda Costa",
    cliente: "Viagens Executivas",
    telefone: "(92) 99876-7890",
    tipo: "Revisão",
    tag: "EXTERNO",
    horario: "11:00",
    data: formatDate(getDateOffset(6)),
  },
];

let mockAgendamentos: AgendaItem[] = [];

function ensureAgendamentosLoaded(): void {
  if (mockAgendamentos.length > 0) return;

  const saved = readArray<AgendaItem>(AGENDA_STORAGE_KEY);
  if (saved.length > 0) {
    mockAgendamentos = saved;
    return;
  }

  mockAgendamentos = [...defaultAgendamentos];
  writeArray(AGENDA_STORAGE_KEY, mockAgendamentos);
}

function persistAgendamentos(): void {
  writeArray(AGENDA_STORAGE_KEY, mockAgendamentos);
}

/**
 * Retorna a data com offset de dias a partir de hoje
 * Auxiliar para gerar mock data com datas dinâmicas
 * 
 * @param days Número de dias a somar
 * @returns Date
 */
function getDateOffset(days: number): Date {
  const date = getBrasiliaNow();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Obtém todos os agendamentos
 * Em produção, isso faria um fetch para o backend
 * 
 * @returns Array de AgendaItem
 */
export function getAgendamentos(): AgendaItem[] {
  ensureAgendamentosLoaded();
  return mockAgendamentos;
}

/**
 * Sincroniza os agendamentos mock com boxes automáticos
 * Chamado na inicialização
 */
export function initializeAgendamentos(): void {
  ensureAgendamentosLoaded();
  let updated = false;
  // Auto-alocar boxes para todos os agendamentos que não têm
  mockAgendamentos.forEach((agendamento) => {
    if (!agendamento.boxId) {
      const boxAlocado = autoAlocateBox(agendamento);
      if (boxAlocado) {
        agendamento.boxId = boxAlocado.boxId;
        agendamento.boxNome = boxAlocado.boxNome;
        updated = true;
        // Sincroniza com occupações
        syncOcupacaoFromAgendamento(agendamento);
      }
    }
  });

  if (updated) {
    persistAgendamentos();
  }
}

/**
 * Obtém agendamentos para uma data específica
 * 
 * @param data Data no formato dd/mm
 * @returns Array de AgendaItem filtrados por data
 */
export function getAgendamentosPorData(data: string): AgendaItem[] {
  ensureAgendamentosLoaded();
  return mockAgendamentos.filter((item) => item.data === data);
}

/**
 * Obtém agendamentos por responsável
 * 
 * @param responsavel Nome do responsável
 * @returns Array de AgendaItem filtrados
 */
export function getAgendamentosPorResponsavel(responsavel: string): AgendaItem[] {
  ensureAgendamentosLoaded();
  return mockAgendamentos.filter((item) => item.responsavel === responsavel);
}

/**
 * Obtém agendamentos por tag (INTERNO/EXTERNO)
 * 
 * @param tag INTERNO ou EXTERNO
 * @returns Array de AgendaItem filtrados
 */
export function getAgendamentosPorTag(tag: "INTERNO" | "EXTERNO"): AgendaItem[] {
  ensureAgendamentosLoaded();
  return mockAgendamentos.filter((item) => item.tag === tag);
}

/**
 * Adiciona um novo agendamento
 * Em produção, isso faria um POST para o backend
 * 
 * @param agendamento Novo agendamento
 * @returns Agendamento com ID atribuído
 */
export function addAgendamento(agendamento: Omit<AgendaItem, "id">): AgendaItem {
  ensureAgendamentosLoaded();
  const novoAgendamento: AgendaItem = {
    ...agendamento,
    id: String(Math.max(...mockAgendamentos.map((a) => parseInt(a.id)), 0) + 1),
  };
  
  // Auto-alocar box
  const boxAlocado = autoAlocateBox(novoAgendamento);
  if (boxAlocado) {
    novoAgendamento.boxId = boxAlocado.boxId;
    novoAgendamento.boxNome = boxAlocado.boxNome;
  }
  
  mockAgendamentos.push(novoAgendamento);
  persistAgendamentos();
  
  // Sincroniza ocupação de box se houver boxId
  if (novoAgendamento.boxId) {
    syncOcupacaoFromAgendamento(novoAgendamento);
  }
  
  return novoAgendamento;
}

/**
 * Deleta um agendamento
 * Em produção, isso faria um DELETE para o backend
 * 
 * @param id ID do agendamento
 * @returns boolean indicando sucesso
 */
export function deleteAgendamento(id: string): boolean {
  ensureAgendamentosLoaded();
  const index = mockAgendamentos.findIndex((a) => a.id === id);
  if (index === -1) return false;
  
  // Remove ocupação de box se existir
  removeOcupacaoByAgendamentoId(id);
  
  mockAgendamentos.splice(index, 1);
  persistAgendamentos();
  return true;
}

/**
 * Atualiza um agendamento
 * Em produção, isso faria um PUT para o backend
 * 
 * @param id ID do agendamento
 * @param dados Dados a atualizar
 * @returns Agendamento atualizado ou undefined
 */
export function updateAgendamento(
  id: string,
  dados: Partial<Omit<AgendaItem, "id">>
): AgendaItem | undefined {
  ensureAgendamentosLoaded();
  const index = mockAgendamentos.findIndex((a) => a.id === id);
  if (index === -1) return undefined;
  
  mockAgendamentos[index] = {
    ...mockAgendamentos[index],
    ...dados,
  };
  
  const agendamentoAtualizado = mockAgendamentos[index];
  
  // Se foi alterado horário, data, tipo ou duração, re-alocar box automaticamente
  const mudouCriterio = 
    dados.horario !== undefined || 
    dados.data !== undefined || 
    dados.tipo !== undefined ||
    dados.duracaoEstimada !== undefined ||
    dados.boxId !== undefined; // Se tentou mudar boxId manualmente
  
  if (mudouCriterio) {
    // Tentar auto-alocar novo box
    const boxAlocado = autoAlocateBox(agendamentoAtualizado);
    if (boxAlocado) {
      agendamentoAtualizado.boxId = boxAlocado.boxId;
      agendamentoAtualizado.boxNome = boxAlocado.boxNome;
    } else {
      // Se não conseguir alocar, remover alocação anterior
      agendamentoAtualizado.boxId = undefined;
      agendamentoAtualizado.boxNome = undefined;
    }
    
    // Ressincroniza ocupação de box
    if (agendamentoAtualizado.boxId) {
      syncOcupacaoFromAgendamento(agendamentoAtualizado);
    } else {
      removeOcupacaoByAgendamentoId(id);
    }
  }

  persistAgendamentos();
  
  return agendamentoAtualizado;
}

/**
 * Atualiza agendamento vinculado a um cliente pelo clienteId
 * Usado quando um cliente é editado na tela de cadastro completo
 * 
 * @param clienteId ID do cliente
 * @param dados Dados a atualizar no agendamento
 * @returns Agendamento atualizado ou undefined
 */
export function updateAgendamentoByClienteId(
  clienteId: string,
  dados: Partial<Omit<AgendaItem, "id" | "clienteId">>
): AgendaItem | undefined {
  ensureAgendamentosLoaded();
  const agendamento = mockAgendamentos.find((a) => a.clienteId === clienteId);
  if (!agendamento) {
    console.warn(`Nenhum agendamento encontrado para clienteId: ${clienteId}`);
    return undefined;
  }
  
  return updateAgendamento(agendamento.id, dados);
}

/**
 * Move um agendamento para outra data
 * Preparado para futuro drag-and-drop
 * 
 * @param id ID do agendamento
 * @param novaData Nova data (formato dd/mm)
 * @returns boolean indicando sucesso
 */
export function moveAgendamento(id: string, novaData: string): boolean {
  ensureAgendamentosLoaded();
  const agendamento = mockAgendamentos.find((a) => a.id === id);
  if (!agendamento) return false;
  agendamento.data = novaData;
  
  // Re-alocar box automaticamente para a nova data
  const boxAlocado = autoAlocateBox(agendamento);
  if (boxAlocado) {
    agendamento.boxId = boxAlocado.boxId;
    agendamento.boxNome = boxAlocado.boxNome;
    syncOcupacaoFromAgendamento(agendamento);
  } else {
    // Se não conseguir alocar nenhum box, remover alocação
    const temBoxAnterior = !!agendamento.boxId;
    agendamento.boxId = undefined;
    agendamento.boxNome = undefined;
    if (temBoxAnterior) {
      removeOcupacaoByAgendamentoId(id);
    }
  }

  persistAgendamentos();
  
  return true;
}
