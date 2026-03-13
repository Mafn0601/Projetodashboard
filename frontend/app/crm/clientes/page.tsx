'use client';

import { useState, useEffect } from 'react';
import { LeadDashboard } from '@/components/leads/LeadDashboard';
import ClienteTable from '@/components/cliente/ClienteTable';
import { clienteServiceAPI } from '@/services/clienteServiceAPI';
import type { ClienteCompleto } from '@/services/clienteService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ClienteModalCompleto from '@/components/cliente/ClienteModalCompleto';

type CrmTab = 'leads' | 'clientes';

export default function Page() {
  const [clientes, setClientes] = useState<ClienteCompleto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompleto, setEditingCompleto] = useState<ClienteCompleto | undefined>();
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<CrmTab>('leads');
  const [leadCreateNonce, setLeadCreateNonce] = useState(0);

  const carregarClientes = async (options?: { silent?: boolean; forceRefresh?: boolean }) => {
    const silent = options?.silent ?? false;
    const forceRefresh = options?.forceRefresh ?? false;
    try {
      if (!silent) setLoading(true);
      const resultado = await clienteServiceAPI.findAll({ ativo: true }, { preferCache: true, forceRefresh });
      setClientes(resultado || []);
    } catch {
      setClientes([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const cached = clienteServiceAPI.getCached();
    if (cached.length > 0) {
      setClientes(cached.filter((c) => c.ativo === true));
      setLoading(false);
      clienteServiceAPI
        .findAll({ ativo: true }, { forceRefresh: true })
        .then((r) => setClientes((r || []).filter((c) => c.ativo === true)))
        .catch(() => {});
    } else {
      carregarClientes({ forceRefresh: true });
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) carregarClientes({ silent: true, forceRefresh: true });
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const clientesFiltrados = clientes.filter((c) => {
    const termo = busca.toLowerCase();
    return (
      (c.nome || c.nomeCliente || '').toLowerCase().includes(termo) ||
      (c.email || c.emailCliente || '').toLowerCase().includes(termo) ||
      (c.telefone || '').toLowerCase().includes(termo) ||
      (c.cpfCnpj || '').toLowerCase().includes(termo)
    );
  });

  const handleDelete = async (id: string) => {
    if (deletingIds.has(id)) return;
    setDeletingIds((prev) => new Set(prev).add(id));
    setClientes((prev) => prev.filter((c) => c.id !== id));
    const sucesso = await clienteServiceAPI.delete(id);
    setDeletingIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
    if (!sucesso) await carregarClientes({ forceRefresh: true });
    else void carregarClientes({ silent: true, forceRefresh: true });
  };

  const handleSaved = async (cliente?: ClienteCompleto) => {
    if (cliente) {
      setClientes((prev) => {
        const idx = prev.findIndex((c) => c.id === cliente.id);
        if (idx === -1) return [cliente, ...prev];
        const next = [...prev];
        next[idx] = { ...next[idx], ...cliente };
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

  const handleNovoCadastro = () => {
    if (activeTab === 'leads') {
      setLeadCreateNonce((prev) => prev + 1);
      return;
    }

    handleOpenModal();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">CRM - Clientes e Leads</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Gestao comercial em uma tela unica com abas para leads e clientes.
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={handleNovoCadastro}
          disabled={isCreating}
          className={isCreating ? 'opacity-70 cursor-not-allowed' : ''}
        >
          {isCreating ? (
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Abrindo...
            </span>
          ) : (
            'Novo Cadastro'
          )}
        </Button>
      </header>

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            activeTab === 'leads'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Leads
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('clientes')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            activeTab === 'clientes'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Clientes
        </button>
      </div>

      {activeTab === 'leads' ? (
        <LeadDashboard compact hideCreateButton openCreateNonce={leadCreateNonce} />
      ) : (
        <div className="space-y-4">
          <div className="w-full max-w-xs">
            <Input
              placeholder="Buscar por nome, email, telefone ou CPF..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
            {loading ? (
              <p className="text-xs text-slate-600 dark:text-slate-400">Carregando clientes...</p>
            ) : clientes.length === 0 ? (
              <p className="text-xs text-slate-600 dark:text-slate-400">Nenhum cliente cadastrado.</p>
            ) : (
              <ClienteTable
                clientes={clientesFiltrados}
                onDelete={handleDelete}
                deletingIds={deletingIds}
              />
            )}
          </section>
        </div>
      )}

      <ClienteModalCompleto
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCompleto(undefined);
        }}
        onSaved={handleSaved}
        initial={editingCompleto}
      />
    </div>
  );
}

