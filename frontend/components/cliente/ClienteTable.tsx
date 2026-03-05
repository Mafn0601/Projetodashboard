'use client';
import React, { useState } from 'react';
import { ClienteCompleto } from '@/services/clienteService';
import { Button } from '@/components/ui/Button';
import ClienteDetailsModal from '@/components/cliente/ClienteDetailsModal';
import { useAuth } from '@/components/AuthContext';

type Props = {
  clientes: ClienteCompleto[];
  onDelete: (id: string) => void;
  deletingIds?: Set<string>;
};

export default function ClienteTable({ clientes, onDelete, deletingIds = new Set() }: Props) {
  const { user } = useAuth();
  const [selectedCliente, setSelectedCliente] = useState<ClienteCompleto | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const isAdmin = user?.role === 'admin';

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="scrollbar-thin max-h-80 overflow-auto overflow-x-auto">
          <table className="w-full text-left text-xs">
          <thead className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 sticky top-0">
            <tr>
              <th className="px-3 py-2 font-medium">Cliente</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Telefone</th>
              <th className="px-3 py-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
          {clientes.map((c) => (
            <tr key={c.id} className="border-t border-slate-200 dark:border-slate-800 odd:bg-slate-50 even:bg-slate-100 dark:odd:bg-slate-950/60 dark:even:bg-slate-900/40">
              <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{c.nome || c.nomeCliente || '-'}</td>
              <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{c.email || c.emailCliente || '-'}</td>
              <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{c.telefone || '-'}</td>
              <td className="px-3 py-2 text-slate-900 dark:text-slate-100">
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary"
                    className="bg-slate-600 dark:bg-slate-700 text-white hover:bg-slate-700 dark:hover:bg-slate-600"
                    onClick={() => {
                      setSelectedCliente(c);
                      setIsDetailsOpen(true);
                    }}
                  >
                    Mais informações
                  </Button>
                  {isAdmin && (
                    <Button 
                      size=\"sm\" 
                      variant=\"danger\" 
                      onClick={() => onDelete(c.id)}
                      disabled={deletingIds.has(c.id)}
                      className={deletingIds.has(c.id) ? 'opacity-70 cursor-not-allowed' : ''}
                    >
                      {deletingIds.has(c.id) ? (
                        <span className=\"inline-flex items-center gap-2\">
                          <span className=\"inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent\"></span>
                          Deletando...
                        </span>
                      ) : (
                        'Deletar'
                      )}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>

    <ClienteDetailsModal 
      isOpen={isDetailsOpen}
      cliente={selectedCliente}
      onClose={() => setIsDetailsOpen(false)}
    />
    </>
  );
}
