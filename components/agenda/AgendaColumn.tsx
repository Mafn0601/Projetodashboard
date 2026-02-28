'use client';

import { AgendaCard } from "./AgendaCard";
import { AgendaItem } from "@/services/agendaService";

interface AgendaColumnProps {
  nameDay: string;
  date: string;
  items: AgendaItem[];
  onSelectItem: (id: string) => void;
  onDropItem?: (itemId: string, newDate: string) => void;
}

export function AgendaColumn({
  nameDay,
  date,
  items,
  onSelectItem,
  onDropItem,
}: AgendaColumnProps) {
  // Ordenar items por horário
  const sortedItems = [...items].sort((a, b) => {
    const timeA = a.horario.split(':').map(Number);
    const timeB = b.horario.split(':').map(Number);
    const minutesA = timeA[0] * 60 + (timeA[1] || 0);
    const minutesB = timeB[0] * 60 + (timeB[1] || 0);
    return minutesA - minutesB;
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("agendaItemId");
    if (itemId && onDropItem) {
      onDropItem(itemId, date);
    }
  };

  return (
    <div
      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 overflow-hidden flex flex-col"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header da Coluna */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-2 py-1.5 sticky top-0 z-10">
        <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-50 truncate">
          {nameDay}
        </h3>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[10px] text-slate-700 dark:text-slate-400">{date}</p>
          <span className="px-1.5 py-0 text-[10px] font-bold text-white bg-red-600 dark:bg-red-700 rounded-full min-w-5 text-center">
            {sortedItems.length}
          </span>
        </div>
      </div>

      {/* Área de Cards */}
      <div className="flex-1 overflow-y-auto p-1 space-y-1">
        {sortedItems.length === 0 ? (
          <div className="flex items-center justify-center h-16 text-center">
            <p className="text-[10px] text-slate-700 dark:text-slate-400">
              Sem agenda
            </p>
          </div>
        ) : (
          sortedItems.map((item) => (
            <AgendaCard
              key={item.id}
              item={item}
              onClick={onSelectItem}
            />
          ))
        )}
      </div>
    </div>
  );
}
