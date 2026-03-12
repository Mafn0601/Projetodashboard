'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Users, PhoneCall } from 'lucide-react';
import { LeadDashboard } from '@/components/leads/LeadDashboard';
import ClienteTable from '@/components/cliente/ClienteTable';
import { clienteServiceAPI } from '@/services/clienteServiceAPI';
import type { ClienteCompleto } from '@/services/clienteService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ClienteModalCompleto from '@/components/cliente/ClienteModalCompleto';
import * as authService from '@/services/authService';
import { cn } from '@/lib/utils';

type Tab = 'clientes' | 'leads';

export default function Page() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('clientes');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'leads') {
      setActiveTab('leads');
      return;
    }

    setActiveTab('clientes');
  }, [searchParams]);

  // --- estado da aba Clientes ---
  const [clientes, setClientes] = useState<ClienteCompleto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompleto, setEditingCompleto] = useState<ClienteCompleto | undefined>();
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

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

    try {
      const s = authService.getUser();
      if (s && (s.role === 'admin' || s.role === 'user')) {
        // role carregado com sucesso
      }
    } catch {}
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

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">CRM - Clientes e Leads</h1>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Acompanhe relacionamento, conversao e base de clientes em um unico lugar.
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('clientes')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
            activeTab === 'clientes'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
          )}
        >
          <Users className="h-4 w-4" />
          Clientes
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
            activeTab === 'leads'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
          )}
        >
          <PhoneCall className="h-4 w-4" />
          Leads
        </button>
      </div>

      {/* Aba Clientes */}
      {activeTab === 'clientes' && (
        <div className="space-y-6">
          <header className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Clientes</h2>
              <p className="text-xs text-slate-700 dark:text-slate-400">
                Gerencie seus clientes de forma centralizada.
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={handleOpenModal}
              disabled={isCreating}
              className={isCreating ? 'opacity-70 cursor-not-allowed' : ''}
            >
              {isCreating ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Abrindo...
                </span>
              ) : (
                'Novo Cliente'
              )}
            </Button>
          </header>

          <div className="w-full max-w-xs">
            <Input
              placeholder="Buscar por nome, email, telefone ou CPF..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <ClienteModalCompleto
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingCompleto(undefined);
            }}
            onSaved={handleSaved}
            initial={editingCompleto}
          />

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Clientes Cadastrados
            </h2>
            {loading ? (
              <p className="text-xs text-slate-700 dark:text-slate-400">Carregando clientes...</p>
            ) : clientes.length === 0 ? (
              <p className="text-xs text-slate-700 dark:text-slate-400">Nenhum cliente cadastrado.</p>
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

      {/* Aba Leads */}
      {activeTab === 'leads' && <LeadDashboard />}
    </div>
  );
}
