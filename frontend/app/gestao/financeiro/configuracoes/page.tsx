'use client';

import { useEffect, useState } from 'react';
import { FinanceiroNav } from '@/components/financeiro/FinanceiroNav';
import { financeiroServiceAPI } from '@/services/financeiroServiceAPI';

export default function ConfiguracoesFinanceirasPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const [novaForma, setNovaForma] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novoCentro, setNovoCentro] = useState('');
  const [novaConta, setNovaConta] = useState('');
  const [novaRegra, setNovaRegra] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await financeiroServiceAPI.configuracoes();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar configuracoes financeiras');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading) return <div className="p-6 text-sm text-slate-500">Carregando configuracoes...</div>;
  if (error) return <div className="p-6 text-sm text-rose-600">{error}</div>;

  const append = (key: string, value: string, clear: () => void) => {
    if (!value.trim()) return;
    setData((prev: any) => ({
      ...prev,
      [key]: [...(prev?.[key] || []), value.trim()],
    }));
    clear();
  };

  return (
    <div className="space-y-5 pb-10">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Configuracoes Financeiras</h1>
        <p className="text-sm text-slate-600">Cadastre formas de pagamento, categorias, centros de custo, contas bancarias e regras de cobranca.</p>
      </header>

      <FinanceiroNav />

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Formas de pagamento</h2>
          <ul className="mt-3 space-y-2 text-xs">
            {(data?.formasPagamento || []).map((item: string) => <li key={item} className="rounded bg-slate-50 px-3 py-2">{item}</li>)}
          </ul>
          <div className="mt-3 flex gap-2">
            <input className="flex-1 rounded border border-slate-300 px-3 py-2 text-xs" value={novaForma} onChange={(e) => setNovaForma(e.target.value)} placeholder="Nova forma" />
            <button type="button" className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white" onClick={() => append('formasPagamento', novaForma, () => setNovaForma(''))}>Adicionar</button>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Categorias financeiras</h2>
          <ul className="mt-3 space-y-2 text-xs">
            {(data?.categoriasFinanceiras || []).map((item: string) => <li key={item} className="rounded bg-slate-50 px-3 py-2">{item}</li>)}
          </ul>
          <div className="mt-3 flex gap-2">
            <input className="flex-1 rounded border border-slate-300 px-3 py-2 text-xs" value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} placeholder="Nova categoria" />
            <button type="button" className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white" onClick={() => append('categoriasFinanceiras', novaCategoria, () => setNovaCategoria(''))}>Adicionar</button>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Centros de custo</h2>
          <ul className="mt-3 space-y-2 text-xs">
            {(data?.centrosCusto || []).map((item: string) => <li key={item} className="rounded bg-slate-50 px-3 py-2">{item}</li>)}
          </ul>
          <div className="mt-3 flex gap-2">
            <input className="flex-1 rounded border border-slate-300 px-3 py-2 text-xs" value={novoCentro} onChange={(e) => setNovoCentro(e.target.value)} placeholder="Novo centro de custo" />
            <button type="button" className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white" onClick={() => append('centrosCusto', novoCentro, () => setNovoCentro(''))}>Adicionar</button>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Contas bancarias</h2>
          <ul className="mt-3 space-y-2 text-xs">
            {(data?.contasBancarias || []).map((item: string) => <li key={item} className="rounded bg-slate-50 px-3 py-2">{item}</li>)}
          </ul>
          <div className="mt-3 flex gap-2">
            <input className="flex-1 rounded border border-slate-300 px-3 py-2 text-xs" value={novaConta} onChange={(e) => setNovaConta(e.target.value)} placeholder="Nova conta bancaria" />
            <button type="button" className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white" onClick={() => append('contasBancarias', novaConta, () => setNovaConta(''))}>Adicionar</button>
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Regras de cobranca</h2>
        <ul className="mt-3 space-y-2 text-xs">
          {(data?.regrasCobranca || []).map((item: string) => <li key={item} className="rounded bg-slate-50 px-3 py-2">{item}</li>)}
        </ul>
        <div className="mt-3 flex gap-2">
          <input className="flex-1 rounded border border-slate-300 px-3 py-2 text-xs" value={novaRegra} onChange={(e) => setNovaRegra(e.target.value)} placeholder="Nova regra" />
          <button type="button" className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white" onClick={() => append('regrasCobranca', novaRegra, () => setNovaRegra(''))}>Adicionar</button>
        </div>
      </section>
    </div>
  );
}
