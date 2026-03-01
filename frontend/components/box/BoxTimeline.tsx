'use client';

import { useMemo } from 'react';
import { Box, OcupacaoBox } from '@/services/boxService';

const HORARIO_INICIO = 8; // 8:00
const HORARIO_FIM = 18; // 18:00
const ALMOCO_INICIO = 12; // 12:00
const ALMOCO_FIM = 13.5; // 13:30

type Props = {
  box: Box;
  ocupacoes: OcupacaoBox[];
  data: string; // formato dd/mm/yyyy
};

export function BoxTimeline({ box, ocupacoes, data }: Props) {
  // Gera array de horas (8 às 18)
  const horas = useMemo(() => {
    const result = [];
    for (let h = HORARIO_INICIO; h <= HORARIO_FIM; h++) {
      result.push(h);
    }
    return result;
  }, []);

  // Converte hora string (HH:mm) para número decimal
  const horaParaDecimal = (hora: string): number => {
    const [h, m] = hora.split(':').map(Number);
    return h + m / 60;
  };

  // Formata hora para exibição
  const formatarHora = (h: number): string => {
    const horas = Math.floor(h);
    const minutos = Math.round((h - horas) * 60);
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
  };

  // Verifica se um horário está no período de almoço
  const isHorarioAlmoco = (horaDecimal: number): boolean => {
    return horaDecimal >= ALMOCO_INICIO && horaDecimal < ALMOCO_FIM;
  };

  // Calcula ocupação para cada slot de 15 minutos
  const calcularOcupacao = (horaInicio: number) => {
    const slots = [];
    
    for (let i = 0; i < 4; i++) { // 4 slots de 15 min = 1 hora
      const slotHora = horaInicio + (i * 0.25);
      
      // Verifica se está no almoço
      if (isHorarioAlmoco(slotHora)) {
        slots.push({ tipo: 'almoco', ocupacao: null });
        continue;
      }

      // Verifica se há ocupação neste slot
      const ocupacao = ocupacoes.find(oc => {
        if (oc.status === 'cancelado' || oc.status === 'finalizado') return false;
        
        const inicioOc = horaParaDecimal(oc.horaInicio);
        const fimOc = horaParaDecimal(oc.horaFim);
        
        return slotHora >= inicioOc && slotHora < fimOc;
      });

      if (ocupacao) {
        slots.push({ tipo: 'ocupado', ocupacao });
      } else {
        slots.push({ tipo: 'livre', ocupacao: null });
      }
    }

    return slots;
  };

  return (
    <div className="border-2 border-slate-200 dark:border-slate-700/50 rounded-lg overflow-x-scroll touch-pan-x scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-slate-100 dark:scrollbar-track-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm hover:shadow-md">
      <div className="flex gap-2 items-stretch min-w-[760px]">
      {/* Label do Box com informações */}
      <div 
        className="w-36 md:w-40 flex-shrink-0 px-3 md:px-4 py-3 flex flex-col justify-between text-white rounded-none border-r-2 border-slate-200 dark:border-slate-700"
        style={{ backgroundColor: box.cor || '#6366f1' }}
      >
        <div>
          <div className="font-bold text-sm md:text-base">{box.nome}</div>
          <div className="text-xs md:text-sm opacity-90 mt-1">{box.parceiro}</div>
        </div>
        <div className={`text-xs px-2 py-1 rounded text-center font-semibold ${
          ocupacoes.length === 0 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
        }`}>
          {ocupacoes.length === 0 ? '✓ Livre' : `● ${ocupacoes.length} agendado(s)`}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 flex gap-1 p-2 bg-white dark:bg-slate-900/40 min-w-[600px]">
        {horas.map(hora => {
          const slots = calcularOcupacao(hora);
          
          return (
            <div key={hora} className="w-12 flex-shrink-0 flex flex-col gap-0.5">
              {/* Label da hora */}
              <div className="text-center text-xs font-semibold text-slate-700 dark:text-slate-400 h-5">
                {String(hora).padStart(2, '0')}h
              </div>
              
              {/* Slots do horário */}
              <div className="flex flex-col gap-1 flex-1">
                {slots.map((slot, idx) => {
                  if (slot.tipo === 'almoco') {
                    return (
                      <div
                        key={idx}
                        className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-md flex items-center justify-center text-sm font-bold text-slate-800 dark:text-slate-300 border-2 border-slate-400 dark:border-slate-500"
                        title="🍽️ ALMOÇO 12:00-13:30"
                      >
                        🍽️
                      </div>
                    );
                  }

                  if (slot.tipo === 'ocupado' && slot.ocupacao) {
                    const duracao = Math.round(
                      (horaParaDecimal(slot.ocupacao.horaFim) - horaParaDecimal(slot.ocupacao.horaInicio)) * 60
                    );
                    return (
                      <div
                        key={idx}
                        className="flex-1 bg-red-600 dark:bg-red-700 rounded-md hover:bg-red-700 dark:hover:bg-red-800 transition-colors cursor-help shadow-md border border-red-700 dark:border-red-800 flex items-center justify-center p-1"
                        title={`OCUPADO ${slot.ocupacao.horaInicio}-${slot.ocupacao.horaFim} (${duracao}min) | ${slot.ocupacao.veiculo} | ${slot.ocupacao.cliente}`}
                      >
                        <div className="text-white dark:text-red-100 text-center">
                          <div className="text-[10px] font-bold leading-tight">●</div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className="flex-1 bg-emerald-200 dark:bg-emerald-800/60 rounded-md hover:bg-emerald-300 dark:hover:bg-emerald-700 transition-colors cursor-pointer border-2 border-emerald-500 dark:border-emerald-700/50 flex items-center justify-center"
                      title="✓ DISPONÍVEL"
                    >
                      <div className="text-emerald-700 dark:text-emerald-300 text-xs font-bold">✓</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

// Componente de cabeçalho com as horas
export function TimelineHeader() {
  const horas = useMemo(() => {
    const result = [];
    for (let h = HORARIO_INICIO; h <= HORARIO_FIM; h++) {
      result.push(h);
    }
    return result;
  }, []);

  return (
    <div className="flex gap-2 items-stretch mb-4 bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg border-2 border-slate-300 dark:border-slate-700 min-w-[760px]">
      {/* Espaço para o label do box */}
      <div className="w-36 md:w-40 flex-shrink-0 font-bold text-slate-800 dark:text-slate-300 flex items-center text-xs">
        BOX
      </div>
      
      {/* Horas */}
      <div className="flex-1 flex gap-1 p-1 min-w-[600px]">
        {horas.map(hora => (
          <div key={hora} className="w-12 flex-shrink-0">
            <div className="text-center text-xs font-bold text-slate-800 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 rounded-md py-1 px-0.5 border border-slate-300 dark:border-slate-600">
              {String(hora).padStart(2, '0')}:00
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Legenda
export function TimelineLegend() {
  return (
    <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-900/50 mt-6">
      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">📋 Legenda de Status</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
        {/* Disponível */}
        <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900/50 rounded-md border-2 border-emerald-400 dark:border-emerald-700">
          <div className="w-8 h-8 bg-emerald-200 dark:bg-emerald-800/60 rounded-md border-2 border-emerald-500 dark:border-emerald-700/50 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-700 dark:text-emerald-300 font-bold">✓</span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-300">Disponível</div>
            <div className="text-xs text-slate-700 dark:text-slate-400">Slot livre para agendamentos</div>
          </div>
        </div>
        
        {/* Ocupado */}
        <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900/50 rounded-md border-2 border-red-400 dark:border-red-900">
          <div className="w-8 h-8 bg-red-600 dark:bg-red-700 rounded-md border border-red-700 dark:border-red-800 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">●</span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-300">Ocupado</div>
            <div className="text-xs text-slate-700 dark:text-slate-400">Agendamento em andamento</div>
          </div>
        </div>
        
        {/* Almoço */}
        <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900/50 rounded-md border-2 border-slate-400 dark:border-slate-600">
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-md border-2 border-slate-400 dark:border-slate-500 flex items-center justify-center flex-shrink-0">
            <span className="text-slate-800 dark:text-slate-300 text-sm">🍽️</span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-300">Almoço</div>
            <div className="text-xs text-slate-700 dark:text-slate-400">12:00 - 13:30</div>
          </div>
        </div>
      </div>
      
      {/* Dicas */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-2 border-2 border-blue-300 dark:border-blue-800 text-xs text-slate-700 dark:text-slate-300">
        💡 <strong>Dica:</strong> Passe o mouse sobre um slot ocupado para ver detalhes do agendamento (horário, veículo e cliente)
      </div>
      
      <div className="text-xs text-slate-700 dark:text-slate-400 mt-2 flex items-center gap-2">
        <span>🕐 Horário de funcionamento: 08:00 - 18:00</span>
        <span className="text-slate-500 dark:text-slate-500">|</span>
        <span>⏱️ Slots de 15 minutos</span>
      </div>
    </div>
  );
}
