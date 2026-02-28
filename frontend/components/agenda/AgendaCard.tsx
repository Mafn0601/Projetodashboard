'use client';

import { AgendaItem } from "@/services/agendaService";
import { Phone, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { readArray } from "@/lib/storage";

interface AgendaCardProps {
  item: AgendaItem;
  onClick?: (id: string) => void;
}

type Equipe = {
  id: string;
  nome: string;
  login: string;
  [key: string]: unknown;
};

export function AgendaCard({
  item,
  onClick,
}: AgendaCardProps) {
  const [nomeResponsavel, setNomeResponsavel] = useState(item.responsavel || '-');

  useEffect(() => {
    if (!item.responsavel) {
      setNomeResponsavel('-');
      return;
    }
    
    try {
      const equipes = readArray<Equipe>('equipes');
      const equipe = equipes.find(e => e.id === item.responsavel);
      if (equipe) {
        setNomeResponsavel(equipe.nome || equipe.login);
      } else {
        setNomeResponsavel(item.responsavel);
      }
    } catch {
      // Se houver erro, manter o valor original
      setNomeResponsavel(item.responsavel || '-');
    }
  }, [item.responsavel]);

  const getTagColor = (tag: "INTERNO" | "EXTERNO") => {
    if (tag === "INTERNO") {
      return "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-800";
    }
    return "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-800";
  };

  return (
    <div
      onClick={() => onClick?.(item.id)}
      className="rounded-lg border-2 p-1.5 transition-all cursor-pointer text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md dark:hover:shadow-lg"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("agendaItemId", item.id);
      }}
    >
      {/* Header - Título + Placa */}
      <div className="flex items-start justify-between gap-1 mb-1">
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-50 truncate">
            {item.titulo}
          </h3>
        </div>
        <span className="px-1 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded whitespace-nowrap flex-shrink-0">
          {item.placa}
        </span>
      </div>

      {/* Responsável e Cliente */}
      <div className="text-[11px] space-y-0 mb-1">
        <p className="text-slate-700 dark:text-slate-400 truncate">
          <span className="font-semibold">R:</span> {nomeResponsavel}
        </p>
        <p className="text-slate-700 dark:text-slate-400 truncate">
          <span className="font-semibold">C:</span> {item.cliente}
        </p>
      </div>

      {/* Telefone + Tipo */}
      <div className="flex items-center gap-1 text-[10px] mb-1">
        <div className="flex items-center gap-0.5 text-slate-700 dark:text-slate-400 flex-1 min-w-0">
          <Phone size={10} className="flex-shrink-0" />
          <span className="truncate">{item.telefone}</span>
        </div>
        <span className="px-1 py-0 text-[10px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded whitespace-nowrap flex-shrink-0">
          {item.tipo}
        </span>
      </div>

      {/* Tag + Horário */}
      <div className="flex items-center justify-between gap-1">
        <span
          className={`px-1 py-0 text-[10px] font-bold rounded ${getTagColor(
            item.tag
          )}`}
        >
          {item.tag}
        </span>
        <div className="flex items-center gap-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/50 px-1 py-0 rounded whitespace-nowrap flex-shrink-0">
          <Clock size={9} />
          {item.horario}
        </div>
      </div>
    </div>
  );
}
