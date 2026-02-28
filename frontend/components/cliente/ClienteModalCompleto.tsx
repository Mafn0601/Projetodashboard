'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import ClienteFormCompleto from '@/components/cliente/ClienteFormCompleto';
import * as clienteService from '@/services/clienteService';

type ClienteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (cliente: clienteService.ClienteCompleto) => void;
  initial?: clienteService.ClienteCompleto;
};

export default function ClienteModal({ isOpen, onClose, onSaved, initial }: ClienteModalProps) {
  if (!isOpen) return null;

  const handleSaved = (cliente?: clienteService.ClienteCompleto) => {
    if (cliente) {
      onSaved(cliente);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-950 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {initial?.id ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-700 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-modal pr-2">
          <div className="p-6">
            <ClienteFormCompleto
              initial={initial}
              onSaved={handleSaved}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
