'use client';

import { useEffect, useMemo, useState } from 'react';
import { FinanceiroNav } from '@/components/financeiro/FinanceiroNav';
import { financeiroServiceAPI } from '@/services/financeiroServiceAPI';

function toCurrency(value: number): string {
  return financeiroServiceAPI.toCurrency(value || 0);
}

export default function FluxoCaixaPage() {
  const [filters, setFilters] = useState({ dataInicial: '', dataFinal: '', categoria: '', contaBancaria: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await financeiroServiceAPI.fluxoCaixa({
        dataInicial: filters.dataInicial || undefined,
        dataFinal: filters.dataFinal || undefined,
        categoria: filters.categoria || undefined,
        contaBancaria: filters.contaBancaria || undefined,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fluxo de caixa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [filters]);

  const serie = data?.serie || [];

  const maxAbs = useMemo(() => {
    return Math.max(1, ...serie.map((item: any) => Math.max(Math.abs(item.entradas), Math.abs(item.saidas))));
  }, [serie]);

  return (
    <div className="space-y-5 pb-10">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Fluxo de Caixa</h1>
        <p className="text-sm text-slate-600">Entradas, saidas, saldo diario e saldo acumulado com filtros de periodo e conta bancaria.</p>
      </header>

      <FinanceiroNav />

      <section className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-xs" type="date" value={filters.dataInicial} onChange={(e) => setFilters((prev) => ({ ...prev, dataInicial: e.target.value }))} />
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-xs" type="date" value={filters.dataFinal} onChange={(e) => setFilters((prev) => ({ ...prev, dataFinal: e.target.value }))} />
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-xs" placeholder="Categoria" value={filters.categoria} onChange={(e) => setFilters((prev) => ({ ...prev, categoria: e.target.value }))} />
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-xs" placeholder="Conta bancaria" value={filters.contaBancaria} onChange={(e) => setFilters((prev) => ({ ...prev, contaBancaria: e.target.value }))} />
      </section>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Entradas</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">{toCurrency(data?.resumo?.entradas || 0)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saidas</p>
          <p className="mt-2 text-2xl font-semibold text-rose-700">{toCurrency(data?.resumo?.saidas || 0)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saldo</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{toCurrency(data?.resumo?.saldo || 0)}</p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Evolucao do caixa e entradas vs saidas</h2>
        {loading ? <p className="mt-3 text-xs text-slate-500">Carregando...</p> : (
          <div className="mt-4 space-y-3">
            {serie.map((item: any) => (
              <div key={item.data} className="grid grid-cols-[90px_1fr_1fr_120px] items-center gap-3 text-xs">
                <span className="text-slate-500">{item.data}</span>
                <div className="h-2 rounded bg-emerald-50"><div className="h-2 rounded bg-emerald-500" style={{ width: `${Math.max(2, Math.round((item.entradas / maxAbs) * 100))}%` }} /></div>
                <div className="h-2 rounded bg-rose-50"><div className="h-2 rounded bg-rose-500" style={{ width: `${Math.max(2, Math.round((item.saidas / maxAbs) * 100))}%` }} /></div>
                <strong>{toCurrency(item.saldoAcumulado)}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Entradas</th>
                <th className="px-3 py-2">Saidas</th>
                <th className="px-3 py-2">Saldo diario</th>
                <th className="px-3 py-2">Saldo acumulado</th>
              </tr>
            </thead>
            <tbody>
              {serie.map((item: any) => (
                <tr key={item.data} className="border-t border-slate-200">
                  <td className="px-3 py-2">{item.data}</td>
                  <td className="px-3 py-2 text-emerald-700">{toCurrency(item.entradas)}</td>
                  <td className="px-3 py-2 text-rose-700">{toCurrency(item.saidas)}</td>
                  <td className="px-3 py-2">{toCurrency(item.saldoDiario)}</td>
                  <td className="px-3 py-2 font-semibold">{toCurrency(item.saldoAcumulado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
