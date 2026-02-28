// lib/mockFormData.ts

/**
 * Dados mock para preenchimento de formulários
 * Estes dados estariam em uma API real depois
 */

export const mockResponsaveis = [
  { value: 'resp_001', label: 'João Silva' },
  { value: 'resp_002', label: 'Maria Santos' },
  { value: 'resp_003', label: 'Pedro Oliveira' },
  { value: 'resp_004', label: 'Ana Costa' },
];

export const mockParceiros = [
  { value: 'parc_001', label: 'Parceiro A' },
  { value: 'parc_002', label: 'Parceiro B' },
  { value: 'parc_003', label: 'Parceiro C' },
  { value: 'parc_004', label: 'Parceiro D' },
];

export const mockTiposAgendamento = [
  { value: 'tipo_agend_001', label: 'Manutenção Preventiva' },
  { value: 'tipo_agend_002', label: 'Manutenção Corretiva' },
  { value: 'tipo_agend_003', label: 'Inspeção' },
  { value: 'tipo_agend_004', label: 'Revisão' },
];

export const mockTipos = [
  { value: 'tipo_001', label: 'Serviço A' },
  { value: 'tipo_002', label: 'Serviço B' },
  { value: 'tipo_003', label: 'Serviço C' },
  { value: 'tipo_004', label: 'Serviço D' },
];

export const mockFabricantes = [
  { value: 'fab_by', label: 'BYD' },
  { value: 'fab_to', label: 'Toyota' },
  { value: 'fab_ki', label: 'Kia' },
];

/**
 * Modelos por fabricante
 */
export const mockModelos: Record<string, Array<{ value: string; label: string }>> = {
  fab_by: [
    { value: 'mod_by1', label: 'Atto 3' },
    { value: 'mod_by2', label: 'Dolphin' },
    { value: 'mod_by3', label: 'Dolphin Mini' },
    { value: 'mod_by4', label: 'Seal' },
    { value: 'mod_by5', label: 'Song Plus' },
    { value: 'mod_by6', label: 'Song Pro' },
    { value: 'mod_by7', label: 'Tan' },
    { value: 'mod_by8', label: 'Han' },
    { value: 'mod_by9', label: 'Yuan Plus' },
    { value: 'mod_by10', label: 'King' },
    { value: 'mod_by11', label: 'Seagull' },
  ],
  fab_to: [
    { value: 'mod_to1', label: 'Corolla' },
    { value: 'mod_to2', label: 'Yaris' },
    { value: 'mod_to3', label: 'Hilux' },
    { value: 'mod_to4', label: 'SW4' },
    { value: 'mod_to5', label: 'Etios' },
    { value: 'mod_to6', label: 'RAV4' },
    { value: 'mod_to7', label: 'Camry' },
    { value: 'mod_to8', label: 'Prius' },
    { value: 'mod_to9', label: 'Corolla Cross' },
  ],
  fab_ki: [
    { value: 'mod_ki1', label: 'Sportage' },
    { value: 'mod_ki2', label: 'Sorento' },
    { value: 'mod_ki3', label: 'Seltos' },
    { value: 'mod_ki4', label: 'Picanto' },
    { value: 'mod_ki5', label: 'Stonic' },
    { value: 'mod_ki6', label: 'Carnival' },
    { value: 'mod_ki7', label: 'EV6' },
  ],
};

/**
 * Horários disponíveis por data
 * Nota: em um sistema real, viria do backend
 */
export function getMockHorarios(data?: string) {
  // Se nenhuma data, retorna vazio
  if (!data) return [];

  // Obtém a data de hoje (timezone local)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  // Parse da data selecionada no formato YYYY-MM-DD (timezone local)
  let dataSelecionada: Date;
  const dateMatch = data.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    dataSelecionada = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } else {
    dataSelecionada = new Date(data);
  }
  dataSelecionada.setHours(0, 0, 0, 0);
  
  const ehHoje = hoje.getTime() === dataSelecionada.getTime();
  
  // Obtém a hora atual
  const agora = new Date();
  const horaAtual = agora.getHours();
  
  // Simula horários disponíveis (9h às 18h, a cada 1h)
  const horarios = [];
  for (let hora = 9; hora <= 18; hora++) {
    // Se for hoje, apenas horários posteriores à hora atual + 1
    // (precisa de pelo menos 1h de antecedência)
    if (ehHoje && hora <= horaAtual) {
      continue;
    }
    
    const horaFormatada = `${String(hora).padStart(2, '0')}:00`;
    horarios.push({
      value: `hora_${hora}`,
      label: horaFormatada
    });
  }

  return horarios;
}

export function getModelosPorFabricante(fabricanteId?: string) {
  if (!fabricanteId || !mockModelos[fabricanteId]) {
    return [];
  }
  return mockModelos[fabricanteId];
}
