'use client';

import React, { useState, useEffect } from 'react';
import { AgendaItem } from '@/services/agendaService';
import { Button } from '@/components/ui/Button';
import { Trash2 } from 'lucide-react';
import { readArray } from '@/lib/storage';

type Props = {
  isOpen: boolean;
  agendamento: AgendaItem | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onChegou: (agendamento: AgendaItem) => void;
};

type Equipe = {
  id: string;
  nome: string;
  login: string;
  [key: string]: unknown;
};

function getTagColor(tag: "INTERNO" | "EXTERNO") {
  if (tag === "INTERNO") {
    return "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-800";
  }
  return "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-800";
}

function formatarData(data: string): string {
  // Esperado formato dd/mm
  if (!data) return "-";
  const [day, month] = data.split("/");
  const date = new Date(2026, parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
}

export default function AgendaDetailsModal({ isOpen, agendamento, onClose, onDelete, onChegou }: Props) {
  const [nomeResponsavel, setNomeResponsavel] = useState(agendamento?.responsavel || '-');

  useEffect(() => {
    if (!agendamento || !agendamento.responsavel) {
      setNomeResponsavel('-');
      return;
    }
    
    try {
      const equipes = readArray<Equipe>('equipes');
      const equipe = equipes.find(e => e.id === agendamento.responsavel);
      if (equipe) {
        setNomeResponsavel(equipe.nome || equipe.login);
      } else {
        setNomeResponsavel(agendamento.responsavel);
      }
    } catch {
      setNomeResponsavel(agendamento.responsavel || '-');
    }
  }, [agendamento]);

  if (!isOpen || !agendamento) return null;

  const handleDelete = () => {
    onDelete(agendamento.id);
    onClose();
  };

  const handleChegou = () => {
    onChegou(agendamento);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-950 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Detalhes do Agendamento
          </h2>
          <button
            onClick={onClose}
            className="text-slate-700 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-modal pr-2">
          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Seção: Informações do Agendamento */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Informações do Agendamento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-700 mb-1">Título</p>
                  <p className="text-slate-900 dark:text-slate-100 font-medium">{agendamento.titulo}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-700 mb-1">Placa</p>
                  <p className="text-slate-900 dark:text-slate-100 font-mono">{agendamento.placa}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-700 mb-1">Data</p>
                  <p className="text-slate-900 dark:text-slate-100">{formatarData(agendamento.data)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-700 mb-1">Horário</p>
                  <p className="text-slate-900 dark:text-slate-100 font-semibold">{agendamento.horario}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-700 mb-1">Tipo de Serviço</p>
                  <p className="text-slate-900 dark:text-slate-100">{agendamento.tipo}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-700 mb-1">Modalidade</p>
                  <span className={`inline-block px-3 py-1 text-xs font-bold rounded ${getTagColor(agendamento.tag)}`}>
                    {agendamento.tag}
                  </span>
                </div>
              </div>
            </div>

            {/* Seção: Informações do Cliente */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Informações do Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-700 mb-1">Cliente</p>
                  <p className="text-slate-900 dark:text-slate-100 font-medium">{agendamento.cliente}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-700 mb-1">Telefone</p>
                  <p className="text-slate-900 dark:text-slate-100">{agendamento.telefone}</p>
                </div>
              </div>
            </div>

            {/* Seção: Responsabilidade */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Responsabilidade
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-700 mb-1">Responsável</p>
                  <p className="text-slate-900 dark:text-slate-100">{nomeResponsavel}</p>
                </div>
                {agendamento.boxNome && (
                  <div>
                    <p className="text-xs text-slate-700 mb-1">Box Alocado Automaticamente</p>
                    <p className="text-slate-900 dark:text-slate-100 font-medium">{agendamento.boxNome}</p>
                  </div>
                )}
                {!agendamento.boxNome && (
                  <div>
                    <p className="text-xs text-slate-700 mb-1">Box</p>
                    <p className="text-slate-700 dark:text-slate-400 italic">Nenhum box disponível para este horário</p>
                  </div>
                )}
              </div>
            </div>

              {/* Seção: Pagamento */}
              {(agendamento.formaPagamento || agendamento.meioPagamento) && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Pagamento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {agendamento.formaPagamento && (
                      <div>
                        <p className="text-xs text-slate-700 mb-1">Forma de Pagamento</p>
                        <p className="text-slate-900 dark:text-slate-100">{agendamento.formaPagamento.replace(/_/g, ' ')}</p>
                      </div>
                    )}
                    {agendamento.meioPagamento && (
                      <div>
                        <p className="text-xs text-slate-700 mb-1">Meio de Pagamento</p>
                        <p className="text-slate-900 dark:text-slate-100">{agendamento.meioPagamento.replace(/_/g, ' ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 dark:bg-red-700 rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
          >
            <Trash2 size={16} />
            Deletar
          </button>
          <Button onClick={handleChegou}>
            Chegou
          </Button>
        </div>
      </div>
    </div>
  );
}
