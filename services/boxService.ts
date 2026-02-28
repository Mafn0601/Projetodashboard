/**
 * Serviço de Boxes de Trabalho
 * Gerencia boxes, ocupações e verificação de disponibilidade
 */

import { readArray, writeArray } from "@/lib/storage";
import { getBrasiliaYear } from "@/lib/dateUtils";

export type TipoBox = "lavagem" | "servico_geral";

export function getTipoBoxPreferidoPorServico(servico: string): TipoBox | undefined {
  if (!servico) return undefined;

  const normalized = servico.toLowerCase();
  const lavagemKeywords = ["lavagem", "revis", "manuten", "alinhamento", "higien"]; 
  const servicoGeralKeywords = ["reparo", "pintura", "funilar", "elétr", "mec", "diagn" ];

  if (lavagemKeywords.some((keyword) => normalized.includes(keyword))) {
    return "lavagem";
  }

  if (servicoGeralKeywords.some((keyword) => normalized.includes(keyword))) {
    return "servico_geral";
  }

  return undefined;
}

export interface Box {
  id: string;
  nome: string;
  tipo: TipoBox;
  parceiroId: string;
  parceiro: string; // Nome do parceiro
  ativo: boolean;
  cor?: string; // Cor para identificação visual
}

export interface OcupacaoBox {
  id: string;
  boxId: string;
  boxNome: string;
  referencia: string; // ID do agendamento ou status
  tipoReferencia: "agendamento" | "status";
  cliente: string;
  veiculo: string;
  dataInicio: string; // formato dd/mm/yyyy
  horaInicio: string; // formato HH:mm
  dataFim: string; // formato dd/mm/yyyy
  horaFim: string; // formato HH:mm
  status: "agendado" | "em_uso" | "finalizado" | "cancelado";
}

// Chaves de storage
const BOX_STORAGE_KEY = "boxes";
const OCUPACAO_STORAGE_KEY = "ocupacoes_box";

// ============ CRUD de Boxes ============

export function getBoxes(): Box[] {
  return readArray<Box>(BOX_STORAGE_KEY);
}

export function getBoxById(id: string): Box | undefined {
  const boxes = getBoxes();
  return boxes.find(b => b.id === id);
}

export function getBoxesByTipo(tipo: TipoBox): Box[] {
  const boxes = getBoxes();
  return boxes.filter(b => b.tipo === tipo && b.ativo);
}

export function getBoxesByParceiro(parceiroId: string): Box[] {
  const boxes = getBoxes();
  return boxes.filter(b => b.parceiroId === parceiroId && b.ativo);
}

export function addBox(box: Omit<Box, "id">): Box {
  const boxes = getBoxes();
  const newBox: Box = {
    ...box,
    id: Date.now().toString(),
  };
  boxes.push(newBox);
  writeArray(BOX_STORAGE_KEY, boxes);
  return newBox;
}

export function updateBox(id: string, updates: Partial<Box>): boolean {
  const boxes = getBoxes();
  const index = boxes.findIndex(b => b.id === id);
  if (index === -1) return false;
  
  boxes[index] = { ...boxes[index], ...updates };
  writeArray(BOX_STORAGE_KEY, boxes);
  return true;
}

export function deleteBox(id: string): boolean {
  const boxes = getBoxes();
  const filtered = boxes.filter(b => b.id !== id);
  if (filtered.length === boxes.length) return false;
  
  writeArray(BOX_STORAGE_KEY, filtered);
  return true;
}

// ============ CRUD de Ocupações ============

export function getOcupacoes(): OcupacaoBox[] {
  return readArray<OcupacaoBox>(OCUPACAO_STORAGE_KEY);
}

export function getOcupacoesByBox(boxId: string): OcupacaoBox[] {
  const ocupacoes = getOcupacoes();
  return ocupacoes.filter(o => o.boxId === boxId);
}

export function getOcupacaoByReferencia(referencia: string, tipo: "agendamento" | "status"): OcupacaoBox | undefined {
  const ocupacoes = getOcupacoes();
  return ocupacoes.find(o => o.referencia === referencia && o.tipoReferencia === tipo);
}

export function addOcupacao(ocupacao: Omit<OcupacaoBox, "id">): OcupacaoBox {
  const ocupacoes = getOcupacoes();
  const newOcupacao: OcupacaoBox = {
    ...ocupacao,
    id: Date.now().toString(),
  };
  ocupacoes.push(newOcupacao);
  writeArray(OCUPACAO_STORAGE_KEY, ocupacoes);
  return newOcupacao;
}

export function updateOcupacao(id: string, updates: Partial<OcupacaoBox>): boolean {
  const ocupacoes = getOcupacoes();
  const index = ocupacoes.findIndex(o => o.id === id);
  if (index === -1) return false;
  
  ocupacoes[index] = { ...ocupacoes[index], ...updates };
  writeArray(OCUPACAO_STORAGE_KEY, ocupacoes);
  return true;
}

export function deleteOcupacao(id: string): boolean {
  const ocupacoes = getOcupacoes();
  const filtered = ocupacoes.filter(o => o.id !== id);
  if (filtered.length === ocupacoes.length) return false;
  
  writeArray(OCUPACAO_STORAGE_KEY, filtered);
  return true;
}

export function deleteOcupacaoByReferencia(referencia: string, tipo: "agendamento" | "status"): boolean {
  const ocupacoes = getOcupacoes();
  const filtered = ocupacoes.filter(o => !(o.referencia === referencia && o.tipoReferencia === tipo));
  if (filtered.length === ocupacoes.length) return false;
  
  writeArray(OCUPACAO_STORAGE_KEY, ocupacoes);
  return true;
}

/**
 * Marca uma ocupação como finalizada/completa (libera o box)
 * Usado quando um status card é movido para finalizado ou entregue
 */
export function completeOcupacao(referencia: string, tipo: "agendamento" | "status"): boolean {
  const ocupacoes = getOcupacoes();
  const index = ocupacoes.findIndex(o => o.referencia === referencia && o.tipoReferencia === tipo);
  if (index === -1) return false;
  
  // Marca como finalizado ao invés de deletar (para histórico)
  ocupacoes[index].status = 'finalizado';
  writeArray(OCUPACAO_STORAGE_KEY, ocupacoes);
  return true;
}

// ============ Verificação de Disponibilidade ============

/**
 * Converte data e hora em timestamp para comparação
 */
function toTimestamp(data: string, hora: string): number {
  // data formato: dd/mm/yyyy
  // hora formato: HH:mm
  const [dia, mes, ano] = data.split('/').map(Number);
  const [horas, minutos] = hora.split(':').map(Number);
  return new Date(ano, mes - 1, dia, horas, minutos).getTime();
}

/**
 * Verifica se há conflito entre dois períodos
 */
function hasConflito(
  inicio1: number,
  fim1: number,
  inicio2: number,
  fim2: number
): boolean {
  // Conflito se um período começa antes do outro terminar
  return inicio1 < fim2 && fim1 > inicio2;
}

/**
 * Verifica se um box está disponível em um determinado período
 */
export function isBoxDisponivel(
  boxId: string,
  dataInicio: string,
  horaInicio: string,
  dataFim: string,
  horaFim: string,
  excluirReferencia?: string // Para permitir edição de agendamento existente
): boolean {
  const ocupacoes = getOcupacoesByBox(boxId);
  
  const inicioDesejado = toTimestamp(dataInicio, horaInicio);
  const fimDesejado = toTimestamp(dataFim, horaFim);
  
  // Verifica conflitos com ocupações ativas
  for (const ocupacao of ocupacoes) {
    // Ignora ocupações canceladas ou finalizadas
    if (ocupacao.status === "cancelado" || ocupacao.status === "finalizado") {
      continue;
    }
    
    // Se estiver editando, ignora a própria ocupação
    if (excluirReferencia && ocupacao.referencia === excluirReferencia) {
      continue;
    }
    
    const inicioOcupacao = toTimestamp(ocupacao.dataInicio, ocupacao.horaInicio);
    const fimOcupacao = toTimestamp(ocupacao.dataFim, ocupacao.horaFim);
    
    if (hasConflito(inicioDesejado, fimDesejado, inicioOcupacao, fimOcupacao)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Lista boxes disponíveis para um determinado período
 */
export function getBoxesDisponiveis(
  dataInicio: string,
  horaInicio: string,
  dataFim: string,
  horaFim: string,
  tipo?: TipoBox,
  excluirReferencia?: string
): Box[] {
  // Limpeza prévia de ocupações que já expiraram
  cleanupExpiredOcupacoes();
  
  let boxes = getBoxes().filter(b => b.ativo);
  
  // Filtra por tipo se especificado
  if (tipo) {
    boxes = boxes.filter(b => b.tipo === tipo);
  }
  
  // Filtra apenas os disponíveis
  return boxes.filter(box => 
    isBoxDisponivel(box.id, dataInicio, horaInicio, dataFim, horaFim, excluirReferencia)
  );
}

/**
 * Obtém ocupações de um box em uma data específica
 */
export function getOcupacoesBoxPorData(boxId: string, data: string): OcupacaoBox[] {
  const ocupacoes = getOcupacoesByBox(boxId);
  
  return ocupacoes.filter(o => {
    // Ignora canceladas ou finalizadas
    if (o.status === "cancelado" || o.status === "finalizado") {
      return false;
    }
    
    // Verifica se a data está entre dataInicio e dataFim
    const [diaData, mesData, anoData] = data.split('/').map(Number);
    const dataTimestamp = new Date(anoData, mesData - 1, diaData).getTime();
    
    const [diaInicio, mesInicio, anoInicio] = o.dataInicio.split('/').map(Number);
    const inicioTimestamp = new Date(anoInicio, mesInicio - 1, diaInicio).getTime();
    
    const [diaFim, mesFim, anoFim] = o.dataFim.split('/').map(Number);
    const fimTimestamp = new Date(anoFim, mesFim - 1, diaFim).getTime();
    
    return dataTimestamp >= inicioTimestamp && dataTimestamp <= fimTimestamp;
  });
}

// ============ Auto-Alocação de Boxes ============

/**
 * Encontra e retorna o melhor box disponível para um agendamento
 * Considera o tipo de serviço e horário
 */
export function autoAlocateBox(agendamento: any): { boxId: string; boxNome: string } | null {
  // Limpeza prévia de ocupações que já expiraram
  cleanupExpiredOcupacoes();
  
  const [dia, mes] = agendamento.data.split('/').map(Number);
  const ano = getBrasiliaYear();
  const dataCompleta = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
  
  const duracao = agendamento.duracaoEstimada || 60;
  const [horas, minutos] = agendamento.horario.split(':').map(Number);
  const dataFim = new Date(ano, mes - 1, dia, horas, minutos + duracao);
  const horaFim = `${String(dataFim.getHours()).padStart(2, '0')}:${String(dataFim.getMinutes()).padStart(2, '0')}`;
  const dataFimStr = `${String(dataFim.getDate()).padStart(2, '0')}/${String(dataFim.getMonth() + 1).padStart(2, '0')}/${dataFim.getFullYear()}`;

  // Determinar tipo de box sugerido (se aplicável)
  const tipoPreferido = getTipoBoxPreferidoPorServico(agendamento.tipo || "");

  // Buscar boxes disponíveis
  const boxesDisponiveis = getBoxesDisponiveis(
    dataCompleta,
    agendamento.horario,
    dataFimStr,
    horaFim,
    tipoPreferido
  );

  if (boxesDisponiveis.length === 0) {
    // Se não houver com tipo preferido, tenta qualquer um
    if (tipoPreferido) {
      const todosDisponiveis = getBoxesDisponiveis(
        dataCompleta,
        agendamento.horario,
        dataFimStr,
        horaFim
      );
      if (todosDisponiveis.length > 0) {
        const box = todosDisponiveis[0];
        return { boxId: box.id, boxNome: box.nome };
      }
    }
    return null;
  }

  // Retornar o primeiro disponível (pode adicionar lógica de priorização depois)
  const box = boxesDisponiveis[0];
  return { boxId: box.id, boxNome: box.nome };
}

// ============ Inicialização com Dados Mock ============

// ============ Sincronização com Agendamentos ============

/**
 * Cria uma ocupação de box a partir de um agendamento
 * Chamado quando um agendamento é criado/atualizado
 */
export function syncOcupacaoFromAgendamento(agendamento: any): OcupacaoBox | null {
  if (!agendamento.boxId) {
    return null; // Sem box atribuído
  }

  // Remove ocupação antiga se existir
  deleteOcupacaoByReferencia(agendamento.id, "agendamento");

  // Converte horário simples (HH:mm) para data completa
  const [dia, mes] = agendamento.data.split('/').map(Number);
  const ano = getBrasiliaYear();
  const dataCompleta = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;

  // Define duração padrão (1h se não especificado)
  const duracao = agendamento.duracaoEstimada || 60;
  
  // Calcula hora de fim
  const [horas, minutos] = agendamento.horario.split(':').map(Number);
  const dataFim = new Date(ano, mes - 1, dia, horas, minutos + duracao);
  const horaFim = `${String(dataFim.getHours()).padStart(2, '0')}:${String(dataFim.getMinutes()).padStart(2, '0')}`;
  const dataFimStr = `${String(dataFim.getDate()).padStart(2, '0')}/${String(dataFim.getMonth() + 1).padStart(2, '0')}/${dataFim.getFullYear()}`;

  const ocupacao: Omit<OcupacaoBox, "id"> = {
    boxId: agendamento.boxId,
    boxNome: agendamento.boxNome || "",
    referencia: agendamento.id,
    tipoReferencia: "agendamento",
    cliente: agendamento.cliente,
    veiculo: agendamento.titulo, // ex: "15 BYD - DOLPHIN"
    dataInicio: dataCompleta,
    horaInicio: agendamento.horario,
    dataFim: dataFimStr,
    horaFim: horaFim,
    status: "agendado",
  };

  return addOcupacao(ocupacao);
}

/**
 * Remove ocupação de box quando um agendamento é deletado
 */
export function removeOcupacaoByAgendamentoId(agendamentoId: string): boolean {
  return deleteOcupacaoByReferencia(agendamentoId, "agendamento");
}

/**
 * Remove ocupações que já passaram de data/hora
 * Evita que boxes fiquem "bloqueados" por agendamentos/status antigos
 */
export function cleanupExpiredOcupacoes(): void {
  const ocupacoes = getOcupacoes();
  const now = new Date();
  
  const filtradas = ocupacoes.filter(ocupacao => {
    // Nunca remove ocupações finalizadas ou canceladas
    if (ocupacao.status === "finalizado" || ocupacao.status === "cancelado") {
      return true;
    }
    
    // Calcula o timestamp de fim da ocupação
    const [diaFim, mesFim, anoFim] = ocupacao.dataFim.split('/').map(Number);
    const [horaFim, minutoFim] = ocupacao.horaFim.split(':').map(Number);
    const fimOcupacao = new Date(anoFim, mesFim - 1, diaFim, horaFim, minutoFim);
    
    // Mantém apenas se ainda não expirou
    return fimOcupacao > now;
  });
  
  writeArray(OCUPACAO_STORAGE_KEY, filtradas);
}

export function syncAllAgendamentosToBoxes(agendamentos: any[]): void {
  // Remove todas as ocupações de agendamentos existentes
  let ocupacoes = getOcupacoes();
  ocupacoes = ocupacoes.filter(o => o.tipoReferencia !== "agendamento");
  writeArray(OCUPACAO_STORAGE_KEY, ocupacoes);
  
  // Ressincroniza todos os agendamentos
  agendamentos.forEach(agendamento => {
    if (agendamento.boxId) {
      syncOcupacaoFromAgendamento(agendamento);
    }
  });
}

export function initializeMockBoxes(): void {
  // Primeiro, limpa ocupações que já expiraram
  cleanupExpiredOcupacoes();
  
  const existingBoxes = getBoxes();
  if (existingBoxes.length > 0) return; // Já tem dados
  
  const mockBoxes: Box[] = [
    {
      id: "box-1",
      nome: "Box 1 - Lavagem",
      tipo: "lavagem",
      parceiroId: "parceiro-1",
      parceiro: "AutoCare",
      ativo: true,
      cor: "#3b82f6", // blue
    },
    {
      id: "box-2",
      nome: "Box 2 - Lavagem",
      tipo: "lavagem",
      parceiroId: "parceiro-1",
      parceiro: "AutoCare",
      ativo: true,
      cor: "#06b6d4", // cyan
    },
    {
      id: "box-3",
      nome: "Box 3 - Serviço Geral",
      tipo: "servico_geral",
      parceiroId: "parceiro-2",
      parceiro: "Motors Plus",
      ativo: true,
      cor: "#8b5cf6", // violet
    },
    {
      id: "box-4",
      nome: "Box 4 - Serviço Geral",
      tipo: "servico_geral",
      parceiroId: "parceiro-2",
      parceiro: "Motors Plus",
      ativo: true,
      cor: "#ec4899", // pink
    },
    {
      id: "box-5",
      nome: "Box 5 - Serviço Geral",
      tipo: "servico_geral",
      parceiroId: "parceiro-3",
      parceiro: "Tech Auto",
      ativo: true,
      cor: "#f59e0b", // amber
    },
  ];
  
  writeArray(BOX_STORAGE_KEY, mockBoxes);
}
