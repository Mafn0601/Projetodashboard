'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusCard as StatusCardType } from '@/services/statusService';
import { updateCardStatus } from '@/services/statusService';
import { readArray } from '@/lib/storage';

type Props = {
  isOpen: boolean;
  card: StatusCardType | null;
  onClose: () => void;
  onDelete: (id: string) => void;
};

type Equipe = {
  id: string;
  nome: string;
  login: string;
  [key: string]: unknown;
};

function getStatusLabel(status: StatusCardType['status']): string {
  const map: Record<StatusCardType['status'], string> = {
    recebido: 'Recebido',
    execucao: 'Em Execucao',
    finalizados: 'Finalizados',
    entregue: 'Entregue',
  };
  return map[status];
}

function getStatusColor(status: StatusCardType['status']): string {
  switch (status) {
    case 'recebido':
      return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800';
    case 'execucao':
      return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-800';
    case 'finalizados':
      return 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-200 border border-orange-200 dark:border-orange-800';
    case 'entregue':
      return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-800';
    default:
      return 'bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800';
  }
}

export default function StatusDetailsModal({ isOpen, card, onClose, onDelete }: Props) {
  const [nomeResponsavel, setNomeResponsavel] = useState(card?.responsavel || '-');

  useEffect(() => {
    if (!card || !card.responsavel) {
      setNomeResponsavel('-');
      return;
    }
    
    try {
      const equipes = readArray<Equipe>('equipes');
      const equipe = equipes.find(e => e.id === card.responsavel);
      if (equipe) {
        setNomeResponsavel(equipe.nome || equipe.login);
      } else {
        setNomeResponsavel(card.responsavel);
      }
    } catch {
      setNomeResponsavel(card.responsavel || '-');
    }
  }, [card]);

  if (!isOpen || !card) return null;

  // Determina o próximo status e label do botão
  const getNextAction = () => {
    if (card.status === 'execucao') {
      return { nextStatus: 'finalizados' as const, label: 'Marcar como Finalizado' };
    }
    if (card.status === 'finalizados') {
      return { nextStatus: 'entregue' as const, label: 'Marcar como Entregue' };
    }
    return null;
  };

  const nextAction = getNextAction();

  const handleAdvanceStatus = () => {
    if (nextAction) {
      const updated = updateCardStatus(card.id, nextAction.nextStatus);
      if (updated) {
        onClose();
      }
    }
  };

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja deletar este card?')) {
      onDelete(card.id);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-950 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Detalhes da OS
          </h2>
          <button
            onClick={onClose}
            className="text-slate-700 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 text-2xl leading-none"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-modal pr-2">
          <div className="p-6 space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Informacoes da OS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-700 mb-1">Numero</p>
                  <p className="text-slate-900 dark:text-slate-100 font-medium">{card.numero}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-700 mb-1">Veiculo</p>
                  <p className="text-slate-900 dark:text-slate-100 font-medium">{card.veiculo}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-700 mb-1">Agendamento</p>
                  <p className="text-slate-900 dark:text-slate-100">{card.dataAgendamento}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-700 mb-1">Saida</p>
                  <p className="text-slate-900 dark:text-slate-100">{card.dataEntrega}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-700 mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 text-xs font-bold rounded ${getStatusColor(card.status)}`}>
                    {getStatusLabel(card.status)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-700 mb-1">Codigo</p>
                  <p className="text-slate-900 dark:text-slate-100 font-mono">{card.id}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Informacoes do Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-700 mb-1">Cliente</p>
                  <p className="text-slate-900 dark:text-slate-100 font-medium">{card.cliente}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-700 mb-1">Parceiro</p>
                  <p className="text-slate-900 dark:text-slate-100">{card.parceiro}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Responsabilidade
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-700 mb-1">Responsavel</p>
                  <p className="text-slate-900 dark:text-slate-100">{nomeResponsavel}</p>
                </div>
                {card.boxNome && (
                  <div>
                    <p className="text-xs text-slate-700 mb-1">Box Alocado</p>
                    <p className="text-slate-900 dark:text-slate-100 font-medium">{card.boxNome}</p>
                  </div>
                )}
              </div>
            </div>

              {/* Seção: Pagamento */}
              {(card.formaPagamento || card.meioPagamento) && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Pagamento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {card.formaPagamento && (
                      <div>
                        <p className="text-xs text-slate-700 mb-1">Forma de Pagamento</p>
                        <p className="text-slate-900 dark:text-slate-100">{card.formaPagamento.replace(/_/g, ' ')}</p>
                      </div>
                    )}
                    {card.meioPagamento && (
                      <div>
                        <p className="text-xs text-slate-700 mb-1">Meio de Pagamento</p>
                        <p className="text-slate-900 dark:text-slate-100">{card.meioPagamento.replace(/_/g, ' ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-end gap-3">
          {nextAction && (
            <button
              onClick={handleAdvanceStatus}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 dark:bg-green-700 rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition-colors"
              type="button"
            >
              <Check size={16} />
              {nextAction.label}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 dark:bg-red-700 rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
            type="button"
          >
            <Trash2 size={16} />
            Deletar
          </button>
        </div>
      </div>
    </div>
  );
}
