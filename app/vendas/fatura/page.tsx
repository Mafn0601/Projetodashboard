'use client';

import { useEffect, useState } from "react";
import {
  listarFaturas,
  marcarFaturaComoPaga,
  type Fatura
} from "@/lib/automation";
import { Button } from "@/components/ui/Button";

export default function Page() {
  const [lista, setLista] = useState<Fatura[]>([]);

  useEffect(() => {
    setLista(listarFaturas());
  }, []);

  const handleMarcarPaga = (id: string) => {
    marcarFaturaComoPaga(id);
    setLista(listarFaturas());
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Faturas
          </h1>
          <p className="text-xs text-slate-700 dark:text-slate-400">
            Gestão de faturas com cálculo automático de comissões ao marcar como pagas.
          </p>
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-200">
          Faturas geradas
        </h2>
        {lista.length === 0 ? (
          <p className="text-xs text-slate-700 dark:text-slate-400">
            Nenhuma fatura gerada até o momento. Crie uma OS para gerar automaticamente.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="scrollbar-thin max-h-80 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-medium">Fatura</th>
                    <th className="px-3 py-2 font-medium">OS</th>
                    <th className="px-3 py-2 font-medium">Valor (R$)</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Ações</th>
                  </tr>
                </thead>
              <tbody>
                {lista.map((fatura) => (
                  <tr
                    key={fatura.id}
                    className="border-t border-slate-200 dark:border-slate-800 odd:bg-slate-50 even:bg-slate-100 dark:odd:bg-slate-950/60 dark:even:bg-slate-900/40">
                    <td className="px-3 py-1.5 text-slate-900 dark:text-slate-100">
                      {fatura.id}
                    </td>
                    <td className="px-3 py-1.5 text-slate-900 dark:text-slate-100">
                      {fatura.osId}
                    </td>
                    <td className="px-3 py-1.5 text-slate-900 dark:text-slate-100">
                      {fatura.valor.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                    <td className="px-3 py-1.5 text-slate-900 dark:text-slate-100">
                      {fatura.status === "paga" ? "Paga" : "Pendente"}
                    </td>
                    <td className="px-3 py-1.5 text-slate-900 dark:text-slate-100">
                      {fatura.status === "pendente" ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleMarcarPaga(fatura.id)}
                        >
                          Marcar como paga
                        </Button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          Comissão gerada automaticamente
                        </span>
                      )}
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

