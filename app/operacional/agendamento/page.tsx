'use client';

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getNext7ValidDays } from "@/lib/dateUtils";
import {
  getAgendamentos,
  getAgendamentosPorData,
  deleteAgendamento,
  moveAgendamento,
  initializeAgendamentos,
  AgendaItem,
} from "@/services/agendaService";
import { addStatusCardFromAgendamento } from "@/services/statusService";
import { AgendaColumn } from "@/components/agenda/AgendaColumn";
import AgendaDetailsModal from "@/components/agenda/AgendaDetailsModal";

export default function Page() {
  const router = useRouter();
  const [updateKey, setUpdateKey] = useState(0);
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Inicializar agendamentos com boxes automáticos na primeira carga
  useEffect(() => {
    initializeAgendamentos();
    setUpdateKey(prev => prev + 1); // Recarregar UI
  }, []);

  // Monitorar mudanças no localStorage e eventos customizados de novo agendamento
  useEffect(() => {
    const handleNewAgendamento = () => {
      setUpdateKey(prev => prev + 1);
    };

    const handleStorageChange = () => {
      setUpdateKey(prev => prev + 1);
    };

    // Ouvir evento customizado (disparado quando agendamento é criado na mesma página)
    window.addEventListener('agendamento:novo', handleNewAgendamento);
    // Ouvir mudanças no localStorage (disparado quando agendamento é criado em outra aba)
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('agendamento:novo', handleNewAgendamento);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Gera os 7 dias válidos (sem domingo) a partir de hoje
  const validDays = useMemo(() => getNext7ValidDays(), []);

  // Obtém todos os agendamentos (recalcula quando updateKey muda)
  const allAgendamentos = useMemo(() => {
    // Limpar flag de novo agendamento
    try {
      localStorage.removeItem('agendamento:novo');
    } catch {}
    return getAgendamentos();
  }, [updateKey]);

  // Agrupa agendamentos por data
  const agendamentosPorData = useMemo(() => {
    const agrupado: { [key: string]: typeof allAgendamentos } = {};
    validDays.forEach((day) => {
      agrupado[day.formatted] = getAgendamentosPorData(day.formatted);
    });
    return agrupado;
  }, [validDays, updateKey]);

  const handleSelectAgendamento = useCallback((id: string) => {
    const agendamento = allAgendamentos.find((a) => a.id === id);
    if (agendamento) {
      setSelectedAgendamento(agendamento);
      setIsModalOpen(true);
    }
  }, [allAgendamentos]);

  const handleDeleteAgendamento = useCallback((id: string) => {
    deleteAgendamento(id);
    setUpdateKey((prev) => prev + 1);
  }, []);

  const handleMoveItem = useCallback((itemId: string, newDate: string) => {
    if (moveAgendamento(itemId, newDate)) {
      setUpdateKey((prev) => prev + 1);
    }
  }, []);

  const handleChegou = useCallback((agendamento: AgendaItem) => {
    addStatusCardFromAgendamento(agendamento);
    deleteAgendamento(agendamento.id);
    setUpdateKey((prev) => prev + 1);
    setIsModalOpen(false);
    setSelectedAgendamento(null);
    router.push("/operacional/status");
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
    <div className="space-y-2 max-w-full">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Agenda de Agendamentos
          </h1>
          <p className="text-[11px] text-slate-700 dark:text-slate-400">
            Próximos 7 dias (sem domingos). Agendamentos criados a partir de Clientes ou Orçamentos.
          </p>
        </div>
      </header>

      {/* Board de 7 Dias */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-2 min-h-[600px]">
        <div key={updateKey} className="grid grid-cols-7 gap-1 w-full h-full">
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

