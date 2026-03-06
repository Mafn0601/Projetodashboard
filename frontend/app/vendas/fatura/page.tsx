'use client';

import { useEffect, useState } from 'react';
import { listarFaturas, type Fatura } from '@/lib/automation';

export default function FaturaPage() {
  const [lista, setLista] = useState<Fatura[]>([]);

  useEffect(() => {
    setLista(listarFaturas());
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Fatura</h1>
        <p className="text-xs text-slate-700 dark:text-slate-400">
          Estrutura preparada para exibição de cliente, OS, serviços e valores.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-3">Dados do Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">Nome: -</div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">Documento: -</div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">Contato: -</div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-3">Dados da OS</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">Número da OS: -</div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">Status: -</div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">Data: -</div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-3">Serviços e Valores</h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
              <tr>
                <th className="px-3 py-2 font-medium">Descrição</th>
                <th className="px-3 py-2 font-medium">Qtd.</th>
                <th className="px-3 py-2 font-medium">Unitário</th>
                <th className="px-3 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-3 py-2 text-slate-900 dark:text-slate-100">Estrutura inicial</td>
                <td className="px-3 py-2 text-slate-900 dark:text-slate-100">-</td>
                <td className="px-3 py-2 text-slate-900 dark:text-slate-100">-</td>
                <td className="px-3 py-2 text-slate-900 dark:text-slate-100">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-3">Faturas geradas</h2>
        {lista.length === 0 ? (
          <p className="text-xs text-slate-700 dark:text-slate-400">Nenhuma fatura gerada até o momento.</p>
        ) : (
          <ul className="space-y-2">
            {lista.map((fatura) => (
              <li key={fatura.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-xs text-slate-900 dark:text-slate-100">
                {fatura.id} • OS {fatura.osId} • R$ {fatura.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • {fatura.status}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
