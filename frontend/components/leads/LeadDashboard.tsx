'use client';

import { startTransition, useDeferredValue, useEffect, useMemo, useState, useTransition } from 'react';
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Mail,
  Phone,
  Plus,
  Search,
  Sparkles,
  StickyNote,
  Trash2,
  TrendingUp,
  UserPlus,
  UserSquare2,
  Users,
  Workflow,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/components/AuthContext';
import { clienteServiceAPI } from '@/services/clienteServiceAPI';
import { CreateLeadPayload, LeadAPI, LeadStatus, leadServiceAPI, LeadSummary } from '@/services/leadServiceAPI';
import { LeadCreateModal } from './LeadCreateModal';
import { LeadMetricCard } from './LeadMetricCard';
import { cn } from '@/lib/utils';

const stageOrder: LeadStatus[] = ['NOVO', 'CONTATO_REALIZADO', 'QUALIFICADO', 'CONVERTIDO'];

const stageMeta: Record<LeadStatus, { label: string; tone: string; progress: number }> = {
  NOVO: { label: 'Novo', tone: 'bg-slate-900 text-white', progress: 18 },
  CONTATO_REALIZADO: { label: 'Contato', tone: 'bg-sky-500 text-white', progress: 46 },
  QUALIFICADO: { label: 'Qualificado', tone: 'bg-amber-500 text-white', progress: 74 },
  CONVERTIDO: { label: 'Convertido', tone: 'bg-emerald-500 text-white', progress: 100 },
  PERDIDO: { label: 'Perdido', tone: 'bg-rose-500 text-white', progress: 100 },
};

const filterChips = [
  { key: 'all', label: 'Todos os Leads' },
  { key: 'mine', label: 'Meus Leads' },
  { key: 'high-score', label: 'Alta Pontuação' },
] as const;

function formatDateTime(value?: string | null): string {
  if (!value) return 'Sem interação';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem interação';

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function LeadDashboard() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<LeadAPI[]>([]);
  const [summary, setSummary] = useState<LeadSummary>({
    totalLeads: 0,
    activeLeads: 0,
    averageScore: 0,
    statusCounts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [createdAfter, setCreatedAfter] = useState('');
  const [activeFilter, setActiveFilter] = useState<(typeof filterChips)[number]['key']>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadAPI | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null);
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);

  const filters = useMemo(() => ({
    search: deferredSearch || undefined,
    mine: activeFilter === 'mine' ? true : undefined,
    minScore: activeFilter === 'high-score' ? 80 : undefined,
    createdAfter: createdAfter || undefined,
    sortBy: 'createdAt' as const,
    sortOrder: 'desc' as const,
    take: 100,
  }), [activeFilter, createdAfter, deferredSearch]);

  const statusSnapshot = useMemo(() => {
    return summary.statusCounts.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.status] = item.total;
      return accumulator;
    }, {});
  }, [summary.statusCounts]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const [leadResponse, summaryResponse] = await Promise.all([
        leadServiceAPI.findAll(filters),
        leadServiceAPI.summary(filters),
      ]);

      startTransition(() => {
        setLeads(leadResponse.leads);
        setSummary(summaryResponse);
      });
    } catch (loadError) {
      console.error('❌ Erro ao carregar dashboard de leads:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, [filters]);

  const handleCreateLead = async (payload: CreateLeadPayload) => {
    try {
      setIsSubmittingCreate(true);
      await leadServiceAPI.create(payload);
      setIsCreateOpen(false);
      await loadDashboard();
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleToggleSequence = async (lead: LeadAPI) => {
    await leadServiceAPI.update(lead.id, {
      emSequencia: !lead.emSequencia,
      ultimaInteracao: new Date().toISOString(),
    });
    await loadDashboard();
  };

  const openNotes = (lead: LeadAPI) => {
    setSelectedLead(lead);
    setNoteDraft(lead.observacoes || '');
  };

  const handleSaveNote = async () => {
    if (!selectedLead) return;

    try {
      setIsSavingNote(true);
      await leadServiceAPI.update(selectedLead.id, {
        observacoes: noteDraft,
        ultimaInteracao: new Date().toISOString(),
      });
      setSelectedLead(null);
      setNoteDraft('');
      await loadDashboard();
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleRefresh = async () => {
    startRefreshTransition(() => {
      void loadDashboard();
    });
  };

  const normalizePhone = (value?: string | null) => String(value || '').replace(/\D/g, '');

  const handleConvertToClient = async (lead: LeadAPI) => {
    if (lead.clienteId) return;

    const phone = normalizePhone(lead.telefone);
    if (phone.length < 10) {
      window.alert('Nao foi possivel converter: telefone do lead invalido para cadastro de cliente.');
      return;
    }

    try {
      setConvertingLeadId(lead.id);

      const novoCliente = await clienteServiceAPI.create({
        nome: lead.nome,
        telefone: phone,
        email: lead.email || undefined,
      });

      if (!novoCliente?.id) {
        window.alert('Falha ao criar cliente a partir do lead.');
        return;
      }

      await leadServiceAPI.update(lead.id, {
        clienteId: novoCliente.id,
        status: 'CONVERTIDO',
        ultimaInteracao: new Date().toISOString(),
      });

      await loadDashboard();
    } catch (error) {
      console.error('Erro ao converter lead em cliente:', error);
      window.alert('Erro ao converter lead em cliente.');
    } finally {
      setConvertingLeadId(null);
    }
  };

  const handleDeleteLead = async (lead: LeadAPI) => {
    const confirmed = window.confirm(`Deseja excluir o lead ${lead.nome}?`);
    if (!confirmed) return;

    try {
      setDeletingLeadId(lead.id);
      await leadServiceAPI.delete(lead.id);
      await loadDashboard();
    } catch (error) {
      console.error('Erro ao excluir lead:', error);
      window.alert('Erro ao excluir lead.');
    } finally {
      setDeletingLeadId(null);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_35%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.94))] p-6 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.45)] dark:border-slate-800/80 dark:bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.12),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(15,23,42,0.92))]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              CRM Performance Layer
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">CRM | Leads</h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
                Gestao visual do funil comercial com score, interacao recente e acoes rapidas ligadas ao backend.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="gap-2 rounded-2xl border-slate-300 bg-white/70 text-slate-900 hover:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-800"
              onClick={() => void handleRefresh()}
              disabled={isRefreshing}
            >
              <ArrowUpRight className="h-4 w-4 shrink-0" />
              {isRefreshing ? 'Atualizando...' : 'Atualizar'}
            </Button>
            <Button className="gap-2 rounded-2xl bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 shrink-0" />
              Adicionar Novo Lead
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <LeadMetricCard
            title="Total de Leads"
            value={String(summary.totalLeads)}
            subtitle={`${leads.length} exibidos na visão atual`}
            icon={Users}
            tone="amber"
          />
          <LeadMetricCard
            title="Leads Ativos"
            value={String(summary.activeLeads)}
            subtitle="Abertos entre novo, contato e qualificado"
            icon={TrendingUp}
            tone="sky"
          />
          <LeadMetricCard
            title="Média de Score"
            value={`${summary.averageScore}`}
            subtitle="Saúde geral da base filtrada agora"
            icon={UserSquare2}
            tone="emerald"
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {filterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setActiveFilter(chip.key)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                  activeFilter === chip.key
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px] xl:min-w-[540px]">
            <div className="relative">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <Search className="h-4 w-4 shrink-0" />
                </span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nome, empresa, cargo ou responsável"
                  className="flex h-11 w-full rounded-lg border-2 border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                </span>
                <input
                  type="date"
                  value={createdAfter}
                  onChange={(event) => setCreatedAfter(event.target.value)}
                  className="flex h-11 w-full rounded-lg border-2 border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500"
                />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Data de Criação</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">Novos: {statusSnapshot.NOVO || 0}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">Contato: {statusSnapshot.CONTATO_REALIZADO || 0}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">Qualificados: {statusSnapshot.QUALIFICADO || 0}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">Convertidos: {statusSnapshot.CONVERTIDO || 0}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">Perdidos: {statusSnapshot.PERDIDO || 0}</span>
          {user ? <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">Usuário: {user.name}</span> : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_-42px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Tabela de Leads</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Visão operacional para acompanhar o funil e executar ações sem sair da tela.</p>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{loading ? 'Carregando...' : `${leads.length} leads carregados`}</div>
          </div>
        </div>

        {error ? (
          <div className="p-6 text-sm text-rose-600 dark:text-rose-400">{error}</div>
        ) : loading ? (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Carregando dashboard...</div>
        ) : leads.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Building2 className="h-6 w-6 shrink-0" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Nenhum lead encontrado</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Ajuste os filtros ou adicione um novo lead para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nome</th>
                  <th className="px-4 py-4 font-semibold">Empresa</th>
                  <th className="px-4 py-4 font-semibold">Cargo</th>
                  <th className="px-4 py-4 font-semibold">Estágio do Funil</th>
                  <th className="px-4 py-4 font-semibold">Última Interação</th>
                  <th className="px-4 py-4 font-semibold">Lead Score</th>
                  <th className="px-6 py-4 font-semibold">Ações rápidas</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const stage = stageMeta[lead.status];
                  const isLost = lead.status === 'PERDIDO';
                  const company = lead.empresa || lead.cliente?.nome || 'Sem empresa';
                  const role = lead.cargo || 'Sem cargo';

                  return (
                    <tr key={lead.id} className="border-t border-slate-200 align-top transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950/60">
                      <td className="px-6 py-5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-200 via-orange-100 to-white text-sm font-semibold text-slate-900">
                            {getInitials(lead.nome)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-950 dark:text-slate-50">{lead.nome}</p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{lead.email || lead.telefone}</p>
                            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                              Resp.: {lead.responsavel?.nome || lead.responsavel?.login || 'Sem responsável'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="space-y-1">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{company}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Origem: {lead.origem || 'Não informada'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{role}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{lead.emSequencia ? 'Em sequência ativa' : 'Sem sequência'}</p>
                      </td>
                      <td className="px-4 py-5">
                        <div className="space-y-3">
                          <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold', stage.tone)}>
                            {stage.label}
                          </span>
                          <div className="w-44 max-w-full">
                            <div className="mb-1 flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              <span>{isLost ? 'Encerrado' : `Etapa ${Math.max(1, stageOrder.indexOf(lead.status) + 1)}`}</span>
                              <span>{stage.progress}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                              <div
                                className={cn('h-2 rounded-full transition-all', isLost ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-500')}
                                style={{ width: `${stage.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-sm text-slate-600 dark:text-slate-300">{formatDateTime(lead.ultimaInteracao || lead.updatedAt)}</td>
                      <td className="px-4 py-5">
                        <div className="w-40 max-w-full">
                          <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300">
                            <span>Score</span>
                            <span>{lead.score}</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800">
                            <div
                              className={cn(
                                'h-2.5 rounded-full transition-all',
                                lead.score >= 80 ? 'bg-emerald-500' : lead.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                              )}
                              style={{ width: `${Math.max(0, Math.min(100, lead.score))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="grid w-[132px] max-w-full grid-cols-3 gap-2">
                          <a href={`tel:${lead.telefone}`} className="inline-flex items-center" title="Ligar para lead" aria-label="Ligar para lead">
                            <Button variant="outline" size="sm" className="h-9 w-9 rounded-xl p-0" aria-label="Ligar para lead">
                              <Phone className="h-4 w-4 shrink-0" />
                            </Button>
                          </a>
                          <a href={`mailto:${lead.email || ''}`} className="inline-flex items-center" title={lead.email ? 'Enviar email' : 'Lead sem email'} aria-label={lead.email ? 'Enviar email' : 'Lead sem email'}>
                            <Button variant="outline" size="sm" className="h-9 w-9 rounded-xl p-0" disabled={!lead.email} aria-label={lead.email ? 'Enviar email' : 'Lead sem email'}>
                              <Mail className="h-4 w-4 shrink-0" />
                            </Button>
                          </a>
                          <Button variant="outline" size="sm" className="h-9 w-9 rounded-xl p-0" onClick={() => openNotes(lead)} title="Criar nota" aria-label="Criar nota">
                            <StickyNote className="h-4 w-4 shrink-0" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 rounded-xl p-0"
                            onClick={() => void handleToggleSequence(lead)}
                            title={lead.emSequencia ? 'Lead na sequência' : 'Adicionar à sequência'}
                            aria-label={lead.emSequencia ? 'Lead na sequência' : 'Adicionar à sequência'}
                          >
                            <Workflow className="h-4 w-4 shrink-0" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 rounded-xl p-0"
                            onClick={() => void handleConvertToClient(lead)}
                            disabled={Boolean(lead.clienteId) || convertingLeadId === lead.id}
                            title={lead.clienteId ? 'Cliente vinculado' : convertingLeadId === lead.id ? 'Convertendo lead' : 'Converter em cliente'}
                            aria-label={lead.clienteId ? 'Cliente vinculado' : convertingLeadId === lead.id ? 'Convertendo lead' : 'Converter em cliente'}
                          >
                            <UserPlus className="h-4 w-4 shrink-0" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 rounded-xl border-rose-200 p-0 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                            onClick={() => void handleDeleteLead(lead)}
                            disabled={deletingLeadId === lead.id}
                            title={deletingLeadId === lead.id ? 'Excluindo lead' : 'Excluir lead'}
                            aria-label={deletingLeadId === lead.id ? 'Excluindo lead' : 'Excluir lead'}
                          >
                            <Trash2 className="h-4 w-4 shrink-0" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <LeadCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateLead}
        isSubmitting={isSubmittingCreate}
      />

      <Modal
        open={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
        title={selectedLead ? `Nota rápida: ${selectedLead.nome}` : 'Nota rápida'}
        description="Registre o contexto mais recente e atualize a última interação do lead."
        className="max-w-2xl"
        showFooter={false}
      >
        <div className="space-y-4">
          <textarea
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            placeholder="Escreva a nota comercial aqui."
            className="min-h-40 w-full rounded-2xl border-2 border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>A última interação será atualizada no salvamento.</span>
            <span>{selectedLead?.responsavel?.nome || selectedLead?.responsavel?.login || 'Sem responsável'}</span>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setSelectedLead(null)} disabled={isSavingNote}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSaveNote()} disabled={isSavingNote}>
              {isSavingNote ? 'Salvando...' : 'Salvar Nota'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}