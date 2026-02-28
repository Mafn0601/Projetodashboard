'use client';

import { useEffect, useState } from "react";
import { listarComissoes, type Comissao } from "@/lib/automation";

export default function Page() {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);

  useEffect(() => {
    setComissoes(listarComissoes());
  }, []);

  const totalComissao = comissoes.reduce(
    (sum, c) => sum + c.valorComissao,
    0
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Comissões
          </h1>
          <p className="text-xs text-slate-700 dark:text-slate-400">
            Comissões calculadas automaticamente sobre faturas pagas (10%).
          </p>
        </div>
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-right">
          <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
            Total de Comissões
          </p>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
            {totalComissao.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </p>
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-200">
          Lançamentos de Comissão
        </h2>
        {comissoes.length === 0 ? (
          <p className="text-xs text-slate-700 dark:text-slate-400">
            Nenhuma comissão registrada ainda. Marque faturas como pagas para gerar comissões.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="scrollbar-thin max-h-80 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-medium">Fatura</th>
                    <th className="px-3 py-2 font-medium">Base (R$)</th>
                    <th className="px-3 py-2 font-medium">Percentual</th>
                    <th className="px-3 py-2 font-medium">Comissão (R$)</th>
                  </tr>
                </thead>
              <tbody>
                {comissoes.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-slate-200 dark:border-slate-800 odd:bg-slate-50 even:bg-slate-100 dark:odd:bg-slate-950/60 dark:even:bg-slate-900/40">
                    <td className="px-3 py-1.5 text-slate-900 dark:text-slate-100">
                      {c.faturaId}
                    </td>
                    <td className="px-3 py-1.5 text-slate-900 dark:text-slate-100">
                      {c.valorBase.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                    <td className="px-3 py-1.5 text-slate-900 dark:text-slate-100">
                      {c.percentual.toLocaleString("pt-BR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                      %
                    </td>
                    <td className="px-3 py-1.5 text-emerald-400">
                      {c.valorComissao.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </section>
    </div>
  );
}

