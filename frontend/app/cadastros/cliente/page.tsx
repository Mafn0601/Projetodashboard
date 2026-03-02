'use client';

import { useState, useEffect } from 'react';
import ClienteTable from '@/components/cliente/ClienteTable';
import { clienteServiceAPI } from '@/services/clienteServiceAPI';
import type { ClienteCompleto } from '@/services/clienteService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ClienteModalCompleto from '@/components/cliente/ClienteModalCompleto';
import * as authService from '@/services/authService';

export default function Page() {
  const [clientes, setClientes] = useState<ClienteCompleto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompleto, setEditingCompleto] = useState<ClienteCompleto | undefined>();
  const [currentRole, setCurrentRole] = useState<'admin' | 'user' | null>(null);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  // Carregar clientes da API ao montar
  useEffect(() => {
    const loadClientes = async () => {
      try {
        setLoading(true);
        const resultado = await clienteServiceAPI.findAll();
        setClientes(resultado || []);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        setClientes([]);
      } finally {
        setLoading(false);
      }
    };

    loadClientes();

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

  // Callback para deletar cliente
  const handleDelete = async (id: string) => {
    const sucesso = await clienteServiceAPI.delete(id);
    if (sucesso) {
      setClientes(prev => prev.filter(c => c.id !== id));
    }
  };

  // Recarregar liste após salvar
  const handleSaved = async (cliente?: ClienteCompleto) => {
    if (cliente) {
      const resultado = await clienteServiceAPI.findAll();
      setClientes(resultado || []);
    }
    setIsModalOpen(false);
    setEditingCompleto(undefined);
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
        onSaved={handleSaved}
        initial={editingCompleto}
      />


      {/* Tabela */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
          Clientes Cadastrados
        </h2>
        {loading ? (
          <p className="text-xs text-slate-700 dark:text-slate-400">
            Carregando clientes...
          </p>
        ) : clientes.length === 0 ? (
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

