'use client';
import React, { useEffect, useState } from 'react';
import { ClienteCompleto } from '@/services/clienteService';
import { Button } from '@/components/ui/Button';
import ClienteDetailsModal from '@/components/cliente/ClienteDetailsModal';
import * as authService from '@/services/authService';

type Props = {
  clientes: ClienteCompleto[];
  onDelete: (id: string) => void;
};

export default function ClienteTable({ clientes, onDelete }: Props) {
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [selectedCliente, setSelectedCliente] = useState<ClienteCompleto | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    try {
      const r = window.localStorage.getItem('currentUserRole') as 'admin' | 'user' | null;
      if (r === 'admin' || r === 'user') {
        setRole(r);
        return;
      }
      // fallback to authService session if available
      const session = authService.getUser();
      if (session && (session.role === 'admin' || session.role === 'user')) {
        setRole(session.role);
        return;
      }
    } catch {
      setRole('user');
    }
  }, []);

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="scrollbar-thin max-h-80 overflow-auto overflow-x-auto">
          <table className="w-full text-left text-sm md:text-xs min-w-[600px]">
          <thead className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 sticky top-0">
            <tr>
              <th className="px-4 py-3 md:px-3 md:py-2 font-medium">Cliente</th>
              <th className="px-4 py-3 md:px-3 md:py-2 font-medium">Email</th>
              <th className="px-4 py-3 md:px-3 md:py-2 font-medium">Telefone</th>
              <th className="px-4 py-3 md:px-3 md:py-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
          {clientes.map((c) => (
            <tr key={c.id} className="border-t border-slate-200 dark:border-slate-800 odd:bg-slate-50 even:bg-slate-100 dark:odd:bg-slate-950/60 dark:even:bg-slate-900/40">
              <td className="px-4 py-3 md:px-3 md:py-1.5 text-slate-900 dark:text-slate-100">{c.nomeCliente}</td>
              <td className="px-4 py-3 md:px-3 md:py-1.5 text-slate-900 dark:text-slate-100">{c.emailCliente || '-'}</td>
              <td className="px-4 py-3 md:px-3 md:py-1.5 text-slate-900 dark:text-slate-100">{c.telefone || '-'}</td>
              <td className="px-4 py-3 md:px-3 md:py-1.5 text-slate-900 dark:text-slate-100">
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
                  {role === 'admin' && (
                    <Button size="sm" variant="danger" onClick={() => onDelete(c.id)}>Deletar</Button>
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
