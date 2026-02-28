'use client';

import { StatusCard as StatusCardType, StatusColumn as StatusColumnType } from "@/services/statusService";
import { StatusCard } from "./StatusCard";

interface StatusColumnProps {
  column: StatusColumnType;
  selectedCards?: Set<string>;
  onSelectCard?: (cardId: string) => void;
  onOpenCard?: (card: StatusCardType) => void;
  onDragStart?: (cardId: string, fromStatus: string) => void;
  onDragEnd?: () => void;
  draggedCardId?: string;
}

export function StatusColumn({
  column,
  selectedCards = new Set(),
  onSelectCard,
  onOpenCard,
  onDragStart,
  onDragEnd,
  draggedCardId,
}: StatusColumnProps) {
  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      {/* Header da coluna com título e contador */}
      <div className="flex items-center gap-2 px-1">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
          {column.title}
        </h2>
        <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-red-600 dark:bg-red-700 rounded-full w-auto min-w-5 h-5">
          {column.cards.length}
        </span>
      </div>

      {/* Container de cards com scroll */}
      <div
        className="flex flex-col gap-1.5 pb-2 min-h-80 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-slate-100 dark:scrollbar-track-slate-800 pr-1"
        data-status={column.status}
      >
        {column.cards.length === 0 ? (
          <div className="flex items-center justify-center h-32 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-500 text-sm">
            Nenhuma OS nesta fase
          </div>
        ) : (
          column.cards.map((card) => (
            <StatusCard
              key={card.id}
              card={card}
              isSelected={selectedCards.has(card.id)}
              onSelect={() => onSelectCard?.(card.id)}
              onOpen={() => onOpenCard?.(card)}
              onDragStart={() => onDragStart?.(card.id, column.status)}
              onDragEnd={onDragEnd}
              isDragging={draggedCardId === card.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
