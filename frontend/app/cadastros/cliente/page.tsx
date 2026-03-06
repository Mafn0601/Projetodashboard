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
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  const carregarClientes = async (options?: { silent?: boolean; forceRefresh?: boolean }) => {
    const silent = options?.silent ?? false;
    const forceRefresh = options?.forceRefresh ?? false;

    try {
      if (!silent) {
        setLoading(true);
      }
      const resultado = await clienteServiceAPI.findAll({ ativo: true }, { preferCache: !forceRefresh, forceRefresh });
      setClientes(resultado || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setClientes([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Carregar clientes da API ao montar
  useEffect(() => {
    const cached = clienteServiceAPI.getCached();
    if (cached.length > 0) {
      setClientes(cached);
      setLoading(false);
      carregarClientes({ silent: true, forceRefresh: true });
    } else {
      carregarClientes({ forceRefresh: true });
    }

    try {
      const s = authService.getUser();
      if (s && (s.role === 'admin' || s.role === 'user')) setCurrentRole(s.role);
      else {
        const r = typeof window !== 'undefined' ? window.localStorage.getItem('currentUserRole') : null;
        if (r === 'admin' || r === 'user') setCurrentRole(r as 'admin' | 'user');
      }
    } catch {}
  }, []);

  // Recarregar dados quando a página ganha foco (detecta mudanças externas)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        carregarClientes({ silent: true, forceRefresh: true });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Filtrar clientes pela busca
  const clientesFiltrados = clientes.filter(c => {
    const termo = busca.toLowerCase();
    return (
      (c.nome || c.nomeCliente || '').toLowerCase().includes(termo) ||
      (c.email || c.emailCliente || '').toLowerCase().includes(termo) ||
      (c.telefone || '').toLowerCase().includes(termo) ||
      (c.cpfCnpj || '').toLowerCase().includes(termo)
    );
  });

  // Callback para deletar cliente
  const handleDelete = async (id: string) => {
    if (deletingIds.has(id)) {
      return;
    }

    setDeletingIds(prev => new Set(prev).add(id));

    // Atualização otimista para feedback imediato
    setClientes(prev => prev.filter(cliente => cliente.id !== id));

    const sucesso = await clienteServiceAPI.delete(id);

    setDeletingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    if (!sucesso) {
      // Recarregar para restaurar estado caso a exclusão falhe
      await carregarClientes({ forceRefresh: true });
      return;
    }

    // Revalidação silenciosa para garantir consistência com backend
    void carregarClientes({ silent: true, forceRefresh: true });
  };

  // Recarregar liste após salvar
  const handleSaved = async (cliente?: ClienteCompleto) => {
    if (cliente) {
      setClientes((prev) => {
        const index = prev.findIndex((c) => c.id === cliente.id);
        if (index === -1) return [cliente, ...prev];
        const next = [...prev];
        next[index] = { ...next[index], ...cliente };
        return next;
      });
      void carregarClientes({ silent: true, forceRefresh: true });
    }
    setIsModalOpen(false);
    setEditingCompleto(undefined);
    setIsCreating(false);
  };

  const handleOpenModal = () => {
    setIsCreating(true);
    setTimeout(() => {
      setEditingCompleto(undefined);
      setIsModalOpen(true);
      setIsCreating(false);
    }, 200);
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
            onClick={handleOpenModal}
            disabled={isCreating}
            className={isCreating ? 'opacity-70 cursor-not-allowed' : ''}
          >
            {isCreating ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Abrindo...
              </span>
            ) : (
              'Novo Formulário'
            )}
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
            deletingIds={deletingIds}
          />
        )}
      </section>
    </div>
  );
}

