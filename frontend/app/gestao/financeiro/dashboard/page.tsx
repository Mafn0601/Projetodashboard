'use client';

import { useEffect, useMemo, useState } from 'react';
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
    const serie = data?.charts?.fluxo30Dias || [];
    const maxAbs = Math.max(
      1,
      ...serie.map((item: any) => Math.max(Math.abs(item.entradas), Math.abs(item.saidas), Math.abs(item.saldoDiario)))
    );

    return serie.slice(-30).map((item: any) => ({
      ...item,
      entradaWidth: `${Math.max(2, Math.round((item.entradas / maxAbs) * 100))}%`,
      saidaWidth: `${Math.max(2, Math.round((item.saidas / maxAbs) * 100))}%`,
    }));
  }, [data]);

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
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Fluxo de caixa (ultimos 30 dias)</h2>
          <div className="mt-4 space-y-3">
            {fluxoSerie.map((item: any) => (
              <div key={item.data} className="grid grid-cols-[90px_1fr_1fr] items-center gap-3 text-xs">
                <span className="text-slate-500 dark:text-slate-300">{item.data}</span>
                <div className="h-2 rounded bg-emerald-50 dark:bg-emerald-900/30">
                  <div className="h-2 rounded bg-emerald-500" style={{ width: item.entradaWidth }} />
                </div>
                <div className="h-2 rounded bg-rose-50 dark:bg-rose-900/30">
                  <div className="h-2 rounded bg-rose-500" style={{ width: item.saidaWidth }} />
                </div>
              </div>
            ))}
          </div>
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
