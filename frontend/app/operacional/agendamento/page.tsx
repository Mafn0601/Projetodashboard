'use client';

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getNext7ValidDays, toDdMmFromISODate } from "@/lib/dateUtils";
import {
  getAgendamentosPorData,
  AgendaItem,
} from "@/services/agendaService";
import { addStatusCardFromAgendamento } from "@/services/statusService";
import { agendamentoServiceAPI, Agendamento } from "@/services/agendamentoServiceAPI";
import { AgendaColumn } from "@/components/agenda/AgendaColumn";
import AgendaDetailsModal from "@/components/agenda/AgendaDetailsModal";

export default function Page() {
  const router = useRouter();
  const [updateKey, setUpdateKey] = useState(0);
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiAgendamentos, setApiAgendamentos] = useState<Agendamento[]>([]);

  // Carregar agendamentos da API
  useEffect(() => {
    const loadAgendamentos = async () => {
      console.log('📤 Carregando agendamentos da API...');
      setIsLoading(true);
      const agendamentos = await agendamentoServiceAPI.findAll({
        status: 'CONFIRMADO' // Apenas agendamentos confirmados
      });
      setApiAgendamentos(agendamentos);
      console.log('✅ Agendamentos carregados da API:', agendamentos.length);
      setIsLoading(false);
    };

    loadAgendamentos();
  }, [updateKey]);

  // Converter dados da API para formato AgendaItem
  const mapAgendamentoToAgendaItem = (agendamento: Agendamento): AgendaItem => {
    const cliente = (agendamento as any).cliente;
    const veiculo = (agendamento as any).veiculo;
    const responsavel = (agendamento as any).responsavel;

    const titulo = veiculo
      ? `${veiculo.anoModelo || ''} ${veiculo.marca || ''} - ${veiculo.modelo || ''}`.trim()
      : 'Agendamento';

    const dataIso = agendamento.dataAgendamento;
    const data = toDdMmFromISODate(dataIso);

    return {
      id: agendamento.id,
      titulo,
      placa: veiculo?.placa || '',
      responsavel: responsavel?.nome || 'Sem responsável',
      cliente: cliente?.nome || 'Sem cliente',
      telefone: cliente?.telefone || '',
      tipo: agendamento.tipoAgendamento,
      tag: 'EXTERNO', // Padrão para API
      horario: agendamento.horarioAgendamento || '09:00',
      data,
      boxId: undefined,
      boxNome: undefined,
      duracaoEstimada: 60, // Padrão, pode ser melhorado
      clienteId: cliente?.id,
      formaPagamento: undefined,
      meioPagamento: undefined,
    };
  };

  // Memoize agendamentos convertidos
  const allAgendamentos = useMemo(() => {
    return apiAgendamentos.map(mapAgendamentoToAgendaItem);
  }, [apiAgendamentos]);

  // Gera os 7 dias válidos (sem domingo) a partir de hoje
  const validDays = useMemo(() => getNext7ValidDays(), []);

  // Agrupa agendamentos por data
  const agendamentosPorData = useMemo(() => {
    const agrupado: { [key: string]: typeof allAgendamentos } = {};
    validDays.forEach((day) => {
      agrupado[day.formatted] = allAgendamentos.filter(
        (a) => a.data === day.formatted
      );
    });
    return agrupado;
  }, [validDays, allAgendamentos]);

  const handleSelectAgendamento = useCallback((id: string) => {
    const agendamento = allAgendamentos.find((a) => a.id === id);
    if (agendamento) {
      setSelectedAgendamento(agendamento);
      setIsModalOpen(true);
    }
  }, [allAgendamentos]);

  const handleDeleteAgendamento = useCallback(async (id: string) => {
    try {
      console.log('📤 Deletando agendamento via API...');
      await agendamentoServiceAPI.delete(id);
      console.log('✅ Agendamento deletado');
      setUpdateKey((prev) => prev + 1);
    } catch (error) {
      console.error('❌ Erro ao deletar agendamento:', error);
    }
  }, []);

  const handleMoveItem = useCallback(async (itemId: string, newDate: string) => {
    try {
      const agendamento = apiAgendamentos.find((a) => a.id === itemId);
      if (!agendamento) return;

      console.log('📤 Movendo agendamento para nova data via API...');
      
      // Converter dd/mm para ISO date (assume ano atual)
      const [dia, mes] = newDate.split('/');
      const ano = new Date().getFullYear();
      const novaDataISO = `${ano}-${mes}-${dia}T${agendamento.horarioAgendamento || '09:00'}:00`;

      await agendamentoServiceAPI.update(itemId, {
        dataAgendamento: novaDataISO,
      });

      console.log('✅ Agendamento movido');
      setUpdateKey((prev) => prev + 1);
    } catch (error) {
      console.error('❌ Erro ao mover agendamento:', error);
    }
  }, [apiAgendamentos]);

  const handleChegou = useCallback(async (agendamento: AgendaItem) => {
    try {
      console.log('📤 Marcando agendamento como chegado...');
      
      // Atualizar status para EXECUTANDO
      await agendamentoServiceAPI.update(agendamento.id, {
        status: 'EXECUTANDO'
      });

      // Criar card de status
      addStatusCardFromAgendamento(agendamento);
      
      console.log('✅ Agendamento marcado como chegado');
      setUpdateKey((prev) => prev + 1);
      setIsModalOpen(false);
      setSelectedAgendamento(null);
      router.push("/operacional/status");
    } catch (error) {
      console.error('❌ Erro ao marcar agendamento como chegado:', error);
    }
  }, [router]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, toDate: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("agendaItemId");
    if (itemId) {
      handleMoveItem(itemId, toDate);
    }
  };

  return (
    <div className="space-y-3 max-w-full">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-base font-semibold text-slate-900 dark:text-slate-50">
            Agenda de Agendamentos
          </h1>
          <p className="text-xs md:text-[11px] text-slate-700 dark:text-slate-400">
            Próximos 7 dias (sem domingos). Agendamentos criados a partir de Clientes ou Orçamentos.
          </p>
        </div>
      </header>

      {/* Board de 7 Dias */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-2 min-h-[520px] md:min-h-[600px]">
        <div className="overflow-x-auto pb-2">
          <div
            key={updateKey}
            className="grid grid-flow-col auto-cols-[minmax(180px,180px)] md:grid-flow-row md:grid-cols-7 md:auto-cols-auto gap-2 md:gap-1 min-w-max md:min-w-0"
          >
          {validDays.map((day) => (
            <div
              key={day.formatted}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day.formatted)}
            >
              <AgendaColumn
                nameDay={day.nameDay}
                date={day.formatted}
                items={agendamentosPorData[day.formatted] || []}
                onSelectItem={handleSelectAgendamento}
                onDropItem={handleMoveItem}
              />
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
        <p className="text-xs text-slate-700 dark:text-slate-400">
          <span className="font-semibold">Dica:</span> Clique nos cards para ver detalhes, arraste entre colunas para mudar a data. Novos agendamentos aparecem automaticamente ao cadastrar clientes.
        </p>
      </div>

      {/* Modal de Detalhes */}
      <AgendaDetailsModal
        isOpen={isModalOpen}
        agendamento={selectedAgendamento}
        onClose={() => setIsModalOpen(false)}
        onDelete={handleDeleteAgendamento}
        onChegou={handleChegou}
      />
    </div>
  );
}

