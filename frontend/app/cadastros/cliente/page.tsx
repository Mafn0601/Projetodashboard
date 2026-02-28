'use client';

import { useState, useEffect } from 'react';
import ClienteTable from '@/components/cliente/ClienteTable';
import * as clienteService from '@/services/clienteService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ClienteModalCompleto from '@/components/cliente/ClienteModalCompleto';
import * as authService from '@/services/authService';

export default function Page() {
  const [clientes, setClientes] = useState<clienteService.ClienteCompleto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompleto, setEditingCompleto] = useState<clienteService.ClienteCompleto | undefined>();
  const [currentRole, setCurrentRole] = useState<'admin' | 'user' | null>(null);
  const [busca, setBusca] = useState('');

  // Carregar clientes completos ao montar
  useEffect(() => {
    const all = clienteService.getAllCompleto();
    setClientes(all);
    try {
      const s = authService.getUser();
      if (s && (s.role === 'admin' || s.role === 'user')) setCurrentRole(s.role);
      else {
        const r = typeof window !== 'undefined' ? window.localStorage.getItem('currentUserRole') : null;
        if (r === 'admin' || r === 'user') setCurrentRole(r as 'admin' | 'user');
      }
    } catch {}
  }, []);

  // Filtrar clientes pela busca
  const clientesFiltrados = clientes.filter(c => {
    const termo = busca.toLowerCase();
    return (
      c.nomeCliente?.toLowerCase().includes(termo) ||
      c.emailCliente?.toLowerCase().includes(termo) ||
      c.telefone?.toLowerCase().includes(termo) ||
      c.placaChassi?.toLowerCase().includes(termo)
    );
  });

  // Callback para deletar completo
  const handleDelete = (id: string) => {
    const remaining = clienteService.removeCompleto(id);
    setClientes(remaining);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Cadastro de Clientes</h1>
          <p className="text-xs text-slate-700 dark:text-slate-400">
            Gerencie seus clientes de forma centralizada.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="primary"
            onClick={() => { setEditingCompleto(undefined); setIsModalOpen(true); }}
          >
            Novo Formulário
          </Button>
        </div>
      </header>

      {/* Campo de Busca */}
      <div className="w-full max-w-xs">
        <Input
          placeholder="Buscar por nome, email, telefone ou placa..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <ClienteModalCompleto
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCompleto(undefined); }}
        onSaved={(cliente) => {
          // atualizar lista completa também
          if (cliente) {
            const all = clienteService.getAllCompleto();
            setClientes(all);
          }
          setIsModalOpen(false);
        }}
        initial={editingCompleto}
      />


      {/* Tabela */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
          Clientes Cadastrados
        </h2>
        {clientes.length === 0 ? (
          <p className="text-xs text-slate-700 dark:text-slate-400">
            Nenhum cliente cadastrado até o momento.
          </p>
        ) : (
          <ClienteTable
            clientes={clientesFiltrados}
            onDelete={handleDelete}
          />
        )}
      </section>
    </div>
  );
}

