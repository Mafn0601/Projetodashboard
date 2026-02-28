// Mock data para Status de Ordens de Serviço
// Estrutura preparada para futura integração com backend

import type { AgendaItem } from "@/services/agendaService";
import { 
  getOcupacaoByReferencia, 
  updateOcupacao,
  addOcupacao 
} from "@/services/boxService";
import { getBrasiliaNow, getBrasiliaYear, toDdMmYyyyFromISODate, getBrasiliaTodayISO } from "@/lib/dateUtils";
import { readArray, writeArray } from "@/lib/storage";

export interface StatusCard {
  id: string;
  numero: string;
  veiculo: string;
  dataAgendamento: string;
  dataEntrega: string;
  cliente: string;
  parceiro: string;
  responsavel: string;
  status: "recebido" | "execucao" | "finalizados" | "entregue";
  boxId?: string; // ID do box alocado
  boxNome?: string; // Nome do box para exibição
  agendamentoId?: string; // Ligação com agendamento original
  horaInicio?: string; // HH:mm do agendamento
  horaFim?: string; // HH:mm do agendamento
  timestampFinalizacao?: number; // Timestamp em ms quando foi para Entregue (para auto-delete em 5 min)
  formaPagamento?: string;
  meioPagamento?: string;
}

export interface StatusColumn {
  id: string;
  title: string;
  status: string;
  cards: StatusCard[];
}

// Mock data - OS por status (usando let para permitir modificações)
const STATUS_STORAGE_KEY = "status_cards";

const defaultCards: StatusCard[] = [
  {
    id: "4",
    numero: "05.5",
    veiculo: "VW GOL",
    dataAgendamento: "25/02/2026",
    dataEntrega: "27/02/2026",
    cliente: "União Viagens",
    parceiro: "AutoCare",
    responsavel: "Roberto Alves",
    status: "recebido",
  },
  {
    id: "5",
    numero: "05.6",
    veiculo: "CHEVROLET ONIX",
    dataAgendamento: "26/02/2026",
    dataEntrega: "28/02/2026",
    cliente: "Empresa XYZ",
    parceiro: "Motors Plus",
    responsavel: "Fernanda Costa",
    status: "recebido",
  },
  {
    id: "6",
    numero: "05.7",
    veiculo: "FIAT ARGO",
    dataAgendamento: "24/02/2026",
    dataEntrega: "27/02/2026",
    cliente: "Márcia Dias",
    parceiro: "Tech Auto",
    responsavel: "Wagner Silva",
    status: "execucao",
  },
  {
    id: "7",
    numero: "05.8",
    veiculo: "HYUNDAI HB20",
    dataAgendamento: "23/02/2026",
    dataEntrega: "26/02/2026",
    cliente: "Hugo Martins",
    parceiro: "AutoCare",
    responsavel: "Beatriz Ferreira",
    status: "execucao",
  },
  {
    id: "8",
    numero: "05.9",
    veiculo: "RENAULT KWID",
    dataAgendamento: "22/02/2026",
    dataEntrega: "25/02/2026",
    cliente: "Lucia Pereira",
    parceiro: "Motors Plus",
    responsavel: "Diego Santos",
    status: "execucao",
  },
  {
    id: "9",
    numero: "05.10",
    veiculo: "NISSAN MARCH",
    dataAgendamento: "20/02/2026",
    dataEntrega: "24/02/2026",
    cliente: "Transport Brasil",
    parceiro: "Tech Auto",
    responsavel: "Sophia Oliveira",
    status: "finalizados",
  },
  {
    id: "10",
    numero: "05.11",
    veiculo: "PEUGEOT 208",
    dataAgendamento: "19/02/2026",
    dataEntrega: "23/02/2026",
    cliente: "Gustavo Ferraz",
    parceiro: "AutoCare",
    responsavel: "Lucas Ribeiro",
    status: "entregue",
  },
  {
    id: "11",
    numero: "05.12",
    veiculo: "SUZUKI VITARA",
    dataAgendamento: "18/02/2026",
    dataEntrega: "22/02/2026",
    cliente: "Viagens Executivas",
    parceiro: "Motors Plus",
    responsavel: "Amanda Costa",
    status: "entregue",
  },
  {
    id: "12",
    numero: "05.13",
    veiculo: "FORD FOCUS",
    dataAgendamento: "17/02/2026",
    dataEntrega: "21/02/2026",
    cliente: "Felipe Rocha",
    parceiro: "Tech Auto",
    responsavel: "Victor Souza",
    status: "entregue",
  },
];

let mockCards: StatusCard[] = [];

function ensureCardsLoaded(): void {
  if (mockCards.length > 0) return;

  const saved = readArray<StatusCard>(STATUS_STORAGE_KEY);
  if (saved.length > 0) {
    mockCards = saved;
    return;
  }

  mockCards = [...defaultCards];
  writeArray(STATUS_STORAGE_KEY, mockCards);
}

function persistCards(): void {
  writeArray(STATUS_STORAGE_KEY, mockCards);
}

function getNextCardId(): string {
  ensureCardsLoaded();
  const maxId = mockCards.reduce((max, card) => {
    const parsed = Number(card.id);
    return Number.isNaN(parsed) ? max : Math.max(max, parsed);
  }, 0);
  return String(maxId + 1);
}

function parseNumeroAndVeiculo(titulo: string): { numero: string; veiculo: string } {
  const match = titulo.match(/^\s*(\d+)\s*(.*)$/);
  if (!match) {
    return { numero: "-", veiculo: titulo.trim() };
  }
  const veiculo = match[2].trim() || titulo.trim();
  return { numero: match[1], veiculo };
}

function normalizeAgendaDate(data: string): string {
  if (!data) return "-";
  const parts = data.split("/");
  if (parts.length === 3) return data;
  if (parts.length === 2) {
    const year = getBrasiliaYear();
    return `${parts[0]}/${parts[1]}/${year}`;
  }
  return data;
}

export function addStatusCardFromAgendamento(agendamento: AgendaItem): StatusCard {
  ensureCardsLoaded();
  const { numero, veiculo } = parseNumeroAndVeiculo(agendamento.titulo);
  const card: StatusCard = {
    id: getNextCardId(),
    numero: numero === "-" ? agendamento.id : numero,
    veiculo,
    dataAgendamento: normalizeAgendaDate(agendamento.data),
    dataEntrega: "-",
    cliente: agendamento.cliente,
    parceiro: "Agendamento",
    responsavel: agendamento.responsavel,
    status: "recebido",
    boxId: agendamento.boxId,
    boxNome: agendamento.boxNome,
    agendamentoId: agendamento.id,
    horaInicio: agendamento.horario,
    horaFim: agendamento.horario, // Será atualizado com base na duração
    formaPagamento: agendamento.formaPagamento,
    meioPagamento: agendamento.meioPagamento,
  };

  mockCards.push(card);
  persistCards();

  // Atualizar ocupação do box para "em_uso" se existir
  if (agendamento.boxId) {
    const ocupacao = getOcupacaoByReferencia(agendamento.id, "agendamento");
    if (ocupacao) {
      // Atualiza para em_uso e muda referência para o status
      updateOcupacao(ocupacao.id, {
        status: "em_uso",
        referencia: card.id,
        tipoReferencia: "status",
      });
    } else {
      // Criar nova ocupação se não existir
      const agoraBrasilia = getBrasiliaNow();
      const dataHoje = toDdMmYyyyFromISODate(getBrasiliaTodayISO());
      const horaAgora = `${String(agoraBrasilia.getHours()).padStart(2, '0')}:${String(agoraBrasilia.getMinutes()).padStart(2, '0')}`;
      
      addOcupacao({
        boxId: agendamento.boxId,
        boxNome: agendamento.boxNome || "Box Desconhecido",
        referencia: card.id,
        tipoReferencia: "status",
        cliente: agendamento.cliente,
        veiculo,
        dataInicio: dataHoje,
        horaInicio: horaAgora,
        dataFim: dataHoje,
        horaFim: horaAgora,
        status: "em_uso",
      });
    }
  }

  return card;
}

export function addStatusCardFromOrcamento(dados: {
  nomeCliente: string;
  veiculo: string; // Ex: "VOLKSWAGEN GOL 2022/2023"
  parceiro: string;
  responsavel: string;
  chassis_placa: string;
  agendamentoId?: string; // ID do agendamento vinculado
}): StatusCard {
  ensureCardsLoaded();
  
  const agoraBrasilia = getBrasiliaNow();
  const dataHoje = toDdMmYyyyFromISODate(getBrasiliaTodayISO());
  
  const card: StatusCard = {
    id: getNextCardId(),
    numero: `OS-${getNextCardId()}`,
    veiculo: dados.veiculo.toUpperCase(),
    dataAgendamento: dataHoje,
    dataEntrega: "-",
    cliente: dados.nomeCliente,
    parceiro: dados.parceiro,
    responsavel: dados.responsavel,
    status: "recebido",
    agendamentoId: dados.agendamentoId, // Vincular ao agendamento
  };

  mockCards.push(card);
  persistCards();

  return card;
}

// Função para obter cards por status
// Função para limpar automaticamente cards em "Entregue" após 5 minutos
export function cleanupDeliveredCards(): void {
  try {
    ensureCardsLoaded();
    const agora = Date.now();
    const CINCO_MINUTOS = 5 * 60 * 1000; // 5 minutos em ms

    const cardsParaRemover = mockCards.filter(card => {
      if (card.status !== 'entregue' || !card.timestampFinalizacao) return false;
      const tempoDecorrido = agora - card.timestampFinalizacao;
      return tempoDecorrido >= CINCO_MINUTOS;
    });

    if (cardsParaRemover.length > 0) {
      mockCards = mockCards.filter(card => {
        if (card.status !== 'entregue' || !card.timestampFinalizacao) return true;
        const tempoDecorrido = agora - card.timestampFinalizacao;
        return tempoDecorrido < CINCO_MINUTOS;
      });
      persistCards();
    }
  } catch (error) {
    console.error('Erro ao limpar cards entregues:', error);
  }
}

export function getCardsByStatus(status: string): StatusCard[] {
  ensureCardsLoaded();
  const statusMap: { [key: string]: string } = {
    recebido: "recebido",
    execucao: "execucao",
    finalizados: "finalizados",
    entregue: "entregue",
  };

  return mockCards.filter((card) => card.status === statusMap[status]);
}

// Função para obter todas as colunas
export function getStatusColumns(): StatusColumn[] {
  ensureCardsLoaded();
  cleanupDeliveredCards(); // Limpar cards expirados
  
  const cardsByStatus: Record<StatusCard["status"], StatusCard[]> = {
    recebido: [],
    execucao: [],
    finalizados: [],
    entregue: [],
  };

  for (const card of mockCards) {
    if (card.status in cardsByStatus) {
      cardsByStatus[card.status].push(card);
    }
  }

  const columns: StatusColumn[] = [
    {
      id: "recebido",
      title: "Recebidos",
      status: "recebido",
      cards: cardsByStatus.recebido,
    },
    {
      id: "execucao",
      title: "Em Execução",
      status: "execucao",
      cards: cardsByStatus.execucao,
    },
    {
      id: "finalizados",
      title: "Finalizados",
      status: "finalizados",
      cards: cardsByStatus.finalizados,
    },
    {
      id: "entregue",
      title: "Entregues",
      status: "entregue",
      cards: cardsByStatus.entregue,
    },
  ];

  return columns;
}

// Função para mover card entre colunas
export function moveCard(
  cardId: string,
  fromStatus: string,
  toStatus: string
): boolean {
  try {
    ensureCardsLoaded();
    const cardIndex = mockCards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return false;

    mockCards[cardIndex].status = toStatus as any;
    
    // Se moveu para "finalizados", liberar o box
    if (toStatus === 'finalizados' && mockCards[cardIndex].boxId) {
      try {
        const { completeOcupacao } = require('./boxService');
        completeOcupacao(mockCards[cardIndex].id, 'status');
      } catch (error) {
        console.error('Erro ao liberar box:', error);
      }
    }

    // Se moveu para "entregue", adicionar timestamp para auto-delete em 5 min
    if (toStatus === 'entregue') {
      mockCards[cardIndex].timestampFinalizacao = Date.now();
    }

    persistCards();
    return true;
  } catch (error) {
    console.error("Erro ao mover card", error);
    return false;
  }
}

// Função para atualizar status manualmente
export function updateCardStatus(
  cardId: string,
  newStatus: StatusCard['status']
): StatusCard | null {
  try {
    ensureCardsLoaded();
    const card = mockCards.find(c => c.id === cardId);
    if (!card) return null;

    card.status = newStatus;

    // Se moveu para "finalizados", liberar o box
    if (newStatus === 'finalizados' && card.boxId) {
      try {
        const { completeOcupacao } = require('./boxService');
        completeOcupacao(card.id, 'status');
      } catch (error) {
        console.error('Erro ao liberar box:', error);
      }
    }

    // Se moveu para "entregue", adicionar timestamp para auto-delete em 5 min
    if (newStatus === 'entregue') {
      card.timestampFinalizacao = Date.now();
    }

    persistCards();
    return card;
  } catch (error) {
    console.error("Erro ao atualizar status do card", error);
    return null;
  }
}

// Função para deletar card
export function deleteCard(cardId: string): boolean {
  try {
    ensureCardsLoaded();
    const index = mockCards.findIndex((c) => c.id === cardId);
    if (index === -1) return false;

    mockCards.splice(index, 1);
    persistCards();
    return true;
  } catch (error) {
    console.error("Erro ao deletar card", error);
    return false;
  }
}

// Função para obter um card específico
export function getCard(cardId: string): StatusCard | undefined {
  ensureCardsLoaded();
  return mockCards.find((c) => c.id === cardId);
}

// Função para resetar dados (útil para testes)
export function resetCards(): void {
  mockCards = [...defaultCards];
  persistCards();
}
