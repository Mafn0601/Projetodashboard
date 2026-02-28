'use client';

import { useRef, useState } from "react";
import { StatusCard as StatusCardType } from "@/services/statusService";

interface StatusCardProps {
  card: StatusCardType;
  isSelected?: boolean;
  onSelect?: () => void;
  onOpen?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

export function StatusCard({
  card,
  isSelected = false,
  onSelect,
  onOpen,
  onDragStart,
  onDragEnd,
  isDragging = false,
}: StatusCardProps) {
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  const pressTimerRef = useRef<number | null>(null);
  const didDragRef = useRef(false);

  const clearPressState = () => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setIsDragEnabled(false);
  };

  const handlePointerDown = () => {
    didDragRef.current = false;
    pressTimerRef.current = window.setTimeout(() => {
      setIsDragEnabled(true);
    }, 180);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const wasDrag = didDragRef.current;
    clearPressState();
    if (wasDrag) return;

    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      onSelect?.();
      return;
    }

    onOpen?.();
  };

  const handlePointerCancel = () => {
    clearPressState();
  };

  const handleDragStartInternal = () => {
    didDragRef.current = true;
    onDragStart?.();
  };

  const handleDragEndInternal = () => {
    clearPressState();
    onDragEnd?.();
  };

  return (
    <button
      draggable={isDragEnabled}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerCancel}
      onPointerCancel={handlePointerCancel}
      onDragStart={handleDragStartInternal}
      onDragEnd={handleDragEndInternal}
      className={`rounded-lg border-2 p-2 hover:shadow-md dark:hover:shadow-lg transition-all cursor-grab active:cursor-grabbing select-none text-left w-full ${
        isDragging
          ? "opacity-50"
          : ""
      } ${
        isSelected
          ? "bg-blue-50 dark:bg-blue-950 border-blue-400 dark:border-blue-600 ring-2 ring-blue-300 dark:ring-blue-700"
          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
      }`}
    >
      {/* Header com número da OS e código */}
      <div className="flex items-start justify-between gap-1 mb-1">
        <h3 className={`font-semibold text-xs leading-tight truncate ${
          isSelected
            ? "text-blue-900 dark:text-blue-100"
            : "text-slate-900 dark:text-slate-100"
        }`}>
          {card.numero}
        </h3>
        <span className={`flex-shrink-0 inline-block px-1 py-0.5 text-xs font-semibold rounded whitespace-nowrap ${
          isSelected
            ? "text-white bg-blue-600 dark:bg-blue-700"
            : "text-white bg-emerald-600 dark:bg-emerald-700"
        }`}>
          {card.id}
        </span>
      </div>

      {/* Veículo */}
      <p className={`text-xs font-medium mb-1 truncate ${
        isSelected
          ? "text-blue-800 dark:text-blue-200"
          : "text-slate-700 dark:text-slate-300"
      }`}>
        {card.veiculo}
      </p>

      {/* Divisor */}
      <div className={`h-px mb-1 ${
        isSelected
          ? "bg-blue-300 dark:bg-blue-700"
          : "bg-slate-200 dark:bg-slate-700"
      }`} />

      {/* Informações */}
      <div className="space-y-0.5 text-xs">
        <div className="flex justify-between gap-1">
          <span className={`flex-shrink-0 ${
            isSelected
              ? "text-blue-700 dark:text-blue-300"
              : "text-slate-700 dark:text-slate-400"
          }`}>Agto:</span>
          <span className={`font-medium ${
            isSelected
              ? "text-blue-900 dark:text-blue-100"
              : "text-slate-900 dark:text-slate-200"
          }`}>
            {card.dataAgendamento}
          </span>
        </div>

        <div className="flex justify-between gap-1">
          <span className={`flex-shrink-0 ${
            isSelected
              ? "text-blue-700 dark:text-blue-300"
              : "text-slate-700 dark:text-slate-400"
          }`}>Saída:</span>
          <span className={`font-medium ${
            isSelected
              ? "text-blue-900 dark:text-blue-100"
              : "text-slate-900 dark:text-slate-200"
          }`}>
            {card.dataEntrega}
          </span>
        </div>

        <div className="flex justify-between gap-1">
          <span className={`flex-shrink-0 ${
            isSelected
              ? "text-blue-700 dark:text-blue-300"
              : "text-slate-700 dark:text-slate-400"
          }`}>Cliente:</span>
          <span className={`font-medium truncate ${
            isSelected
              ? "text-blue-900 dark:text-blue-100"
              : "text-slate-900 dark:text-slate-200"
          }`}>
            {card.cliente}
          </span>
        </div>

        {card.boxNome && (
          <div className="flex justify-between gap-1">
            <span className={`flex-shrink-0 ${
              isSelected
                ? "text-blue-700 dark:text-blue-300"
                : "text-slate-700 dark:text-slate-400"
            }`}>Box:</span>
            <span className={`font-medium truncate ${
              isSelected
                ? "text-blue-900 dark:text-blue-100"
                : "text-slate-900 dark:text-slate-200"
            }`}>
              {card.boxNome}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
