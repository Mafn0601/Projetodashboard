'use client';

import { useState, useCallback, useEffect } from "react";
import { getStatusColumns, moveCard, deleteCard, cleanupDeliveredCards, StatusCard as StatusCardType } from "@/services/statusService";
import { StatusColumn } from "@/components/status/StatusColumn";
import StatusDetailsModal from "@/components/status/StatusDetailsModal";
import { Trash2 } from "lucide-react";

export default function StatusPage() {
  // Estado para forçar atualização quando cards são movidos ou deletados
  const [updateKey, setUpdateKey] = useState(0);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [draggedCard, setDraggedCard] = useState<{ id: string; fromStatus: string } | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsCard, setDetailsCard] = useState<StatusCardType | null>(null);

  // Limpar automaticamente cards "Entregues" a cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupDeliveredCards();
      setUpdateKey((prev) => prev + 1);
    }, 10000); // 10 segundos

    return () => clearInterval(interval);
  }, []);

  // Obter colunas (recalcula quando updateKey muda)
  const columns = getStatusColumns();

  const handleSelectCard = useCallback((cardId: string) => {
    setSelectedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  }, []);

  const handleDeleteSelectedCards = useCallback(() => {
    if (selectedCards.size === 0) return;

    let deletedCount = 0;
    selectedCards.forEach((cardId) => {
      if (deleteCard(cardId)) {
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      setSelectedCards(new Set());
      setUpdateKey((prev) => prev + 1);
    }
  }, [selectedCards]);

  const handleOpenCard = useCallback((card: StatusCardType) => {
    setDetailsCard(card);
    setIsDetailsOpen(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setIsDetailsOpen(false);
    setDetailsCard(null);
  }, []);

  const handleDeleteCard = useCallback((cardId: string) => {
    if (deleteCard(cardId)) {
      setSelectedCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
      setUpdateKey((prev) => prev + 1);
    }
  }, []);

  const handleDragStart = (cardId: string, fromStatus: string) => {
    setDraggedCard({ id: cardId, fromStatus });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, toStatus: string) => {
    e.preventDefault();
    
    if (!draggedCard) return;
    if (draggedCard.fromStatus === toStatus) {
      setDraggedCard(null);
      return;
    }

    // Mover card
    if (moveCard(draggedCard.id, draggedCard.fromStatus, toStatus)) {
      setSelectedCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(draggedCard.id);
        return newSet;
      });
      setUpdateKey((prev) => prev + 1);
    }

    setDraggedCard(null);
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Quadro de Status - OS
          </h1>
          <p className="text-xs text-slate-700 dark:text-slate-400">
            Acompanhe o funil de status das Ordens de Serviço em tempo real.
          </p>
        </div>
      </header>

      {/* Resumo - Grid informativo */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
        <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-200 mb-2">
          Total por Status
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {columns.map((column) => (
            <div
              key={column.id}
              className="rounded-lg bg-white dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700"
            >
              <p className="text-xs text-slate-700 dark:text-slate-400 truncate">
                {column.title}
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {column.cards.length}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3">
        <div className="flex gap-2 w-full">
          {columns.map((column) => (
            <div
              key={`${column.id}-${updateKey}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.status)}
              className="flex-1 min-w-0"
            >
              <StatusColumn
                column={column}
                selectedCards={selectedCards}
                onSelectCard={handleSelectCard}
                onOpenCard={handleOpenCard}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                draggedCardId={draggedCard?.id}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Informações de seleção e ações */}
      {selectedCards.size > 0 && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 p-3 flex items-center justify-between">
          <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
            {selectedCards.size} card(s) selecionado(s)
          </p>
          <button
            onClick={handleDeleteSelectedCards}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 dark:bg-red-700 rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
          >
            <Trash2 size={14} />
            Deletar
          </button>
        </div>
      )}

      {/* Info Footer */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
        <p className="text-xs text-slate-700 dark:text-slate-400">
          <span className="font-semibold">Dica:</span> Clique para ver detalhes, segure para arrastar, use Ctrl/Shift para selecionar.
        </p>
      </div>

      <StatusDetailsModal
        isOpen={isDetailsOpen}
        card={detailsCard}
        onClose={handleCloseDetails}
        onDelete={handleDeleteCard}
      />
    </div>
  );
}


