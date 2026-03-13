'use client';

import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FinanceiroKpiCard } from '@/components/financeiro/FinanceiroKpiCard';
import { FinanceiroNav } from '@/components/financeiro/FinanceiroNav';
import { StatusPill } from '@/components/financeiro/StatusPill';
import { financeiroServiceAPI } from '@/services/financeiroServiceAPI';

function toCurrency(value: number): string {
  return financeiroServiceAPI.toCurrency(value || 0);
}

export default function FinanceiroDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await financeiroServiceAPI.dashboard();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard financeiro');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const cards = data?.cards;

  const fluxoSerie = useMemo(() => {
    const serie: any[] = data?.charts?.fluxo30Dias || [];
    return serie.slice(-30).map((item: any) => ({
      data: item.data,
      Entradas: item.entradas,
      Saidas: item.saidas,
      Saldo: item.saldoDiario,
    }));
  }, [data]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(v);

  if (loading) {
    return <div className="p-6 text-sm text-slate-500 dark:text-slate-300">Carregando dashboard financeiro...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-rose-600 dark:text-rose-300">{error}</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Gestao Financeira</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Visao executiva de caixa, recebimentos, pagamentos e alertas operacionais.</p>
      </header>

      <FinanceiroNav />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FinanceiroKpiCard label="Total a Receber" value={toCurrency(cards?.totalReceber)} tone="positive" />
        <FinanceiroKpiCard label="Total a Pagar" value={toCurrency(cards?.totalPagar)} tone="negative" />
        <FinanceiroKpiCard label="Saldo Atual" value={toCurrency(cards?.saldoAtual)} />
        <FinanceiroKpiCard label="Recebimentos do mes" value={toCurrency(cards?.recebimentosMes)} tone="positive" />
        <FinanceiroKpiCard label="Pagamentos do mes" value={toCurrency(cards?.pagamentosMes)} tone="negative" />
        <FinanceiroKpiCard label="Valores em atraso" value={toCurrency(cards?.valoresAtraso)} tone="negative" />
        <FinanceiroKpiCard label="Previsao de caixa" value={toCurrency(cards?.previsaoCaixa)} tone="positive" />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-2 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Fluxo de caixa — ultimos 30 dias</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={fluxoSerie} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradEntradas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSaidas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="data" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={60} />
              <Tooltip
                formatter={(value, name) => [financeiroServiceAPI.toCurrency(Number(value ?? 0)), String(name)]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="Entradas" stroke="#10b981" strokeWidth={2} fill="url(#gradEntradas)" dot={false} />
              <Area type="monotone" dataKey="Saidas" stroke="#f43f5e" strokeWidth={2} fill="url(#gradSaidas)" dot={false} />
              <Area type="monotone" dataKey="Saldo" stroke="#6366f1" strokeWidth={2} fill="url(#gradSaldo)" dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recebimentos por categoria</h2>
          <ul className="mt-3 space-y-2 text-xs">
            {(data?.charts?.recebimentosPorCategoria || []).map((item: any) => (
              <li key={item.categoria} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <span>{item.categoria}</span>
                <strong>{toCurrency(item.valor)}</strong>
              </li>
            ))}
          </ul>

          <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Pagamentos por categoria</h3>
          <ul className="mt-3 space-y-2 text-xs">
            {(data?.charts?.pagamentosPorCategoria || []).map((item: any) => (
              <li key={item.categoria} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <span>{item.categoria}</span>
                <strong>{toCurrency(item.valor)}</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Faturas vencendo hoje</h2>
          <ul className="mt-3 space-y-2 text-xs">
            {(data?.listasRapidas?.vencendoHoje || []).map((item: any) => (
              <li key={item.id} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <div className="flex items-center justify-between">
                  <strong>{item.codigoFatura}</strong>
                  <StatusPill status={item.status} />
                </div>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{item.cliente}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Faturas em atraso</h2>
          <ul className="mt-3 space-y-2 text-xs">
            {(data?.listasRapidas?.emAtraso || []).map((item: any) => (
              <li key={item.id} className="rounded-lg bg-rose-50 px-3 py-2 dark:bg-rose-950/30">
                <div className="flex items-center justify-between">
                  <strong>{item.codigoFatura}</strong>
                  <span className="text-rose-700 dark:text-rose-300">{item.diasAtraso} dias</span>
                </div>
                <p className="mt-1 text-slate-700 dark:text-slate-200">{toCurrency(item.saldoAberto)}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Ultimos recebimentos</h2>
          <ul className="mt-3 space-y-2 text-xs">
            {(data?.listasRapidas?.ultimosRecebimentos || []).map((item: any) => (
              <li key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <span>{item.formaPagamento}</span>
                <strong>{toCurrency(item.valor)}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Ultimos pagamentos</h2>
          <ul className="mt-3 space-y-2 text-xs">
            {(data?.listasRapidas?.ultimosPagamentos || []).map((item: any) => (
              <li key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <span>{item.formaPagamento}</span>
                <strong>{toCurrency(item.valor)}</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
