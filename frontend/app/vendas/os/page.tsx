'use client';

import { useEffect, useState } from "react";
import { criarOS, listarOS, type OS } from "@/lib/automation";
import { Input } from "@/components/ui/Input";
import { MaskedInput, currencyToNumber } from "@/components/ui/MaskedInput";
import { Button } from "@/components/ui/Button";

export default function Page() {
  const [lista, setLista] = useState<OS[]>([]);
  const [form, setForm] = useState({
    cliente: "",
    tipo: "",
    valor: ""
  });

  useEffect(() => {
    setLista(listarOS());
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valor = currencyToNumber(form.valor || "0") || 0;
    criarOS({
      cliente: form.cliente,
      tipo: form.tipo,
      valor
    });
    setLista(listarOS());
    setForm({ cliente: "", tipo: "", valor: "" });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Ordens de Serviço (Vendas)
          </h1>
          <p className="text-xs text-slate-700 dark:text-slate-400">
            Cadastro de OS com geração automática de fatura.
          </p>
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-200">
          Nova OS
        </h2>
        <form
          className="grid gap-3 md:grid-cols-3"
          onSubmit={handleSubmit}
          noValidate={false}
        >
          <Input
            label="Cliente"
            value={form.cliente}
            onChange={(e) => handleChange("cliente", e.target.value)}
            required
          />
          <Input
            label="Tipo de OS"
            value={form.tipo}
            onChange={(e) => handleChange("tipo", e.target.value)}
            required
          />
          <MaskedInput
            label="Valor (R$)"
            mask="currency"
            placeholder="R$ 0,00"
            value={form.valor}
            onChange={(val) => handleChange("valor", val)}
            required
          />
          <div className="md:col-span-3 flex justify-end">
            <Button type="submit" size="sm">
              Salvar OS (gera Fatura)
            </Button>
          </div>
        </form>
        <p className="mt-1 text-[11px] text-slate-700 dark:text-slate-400">
          Ao salvar, uma fatura pendente é criada automaticamente com o mesmo valor da OS.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-200">
          OS cadastradas
        </h2>
        {lista.length === 0 ? (
          <p className="text-xs text-slate-700 dark:text-slate-400">
            Nenhuma OS cadastrada até o momento.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="scrollbar-thin max-h-80 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-medium">Cliente</th>
                    <th className="px-3 py-2 font-medium">Tipo</th>
                    <th className="px-3 py-2 font-medium">Valor (R$)</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
              <tbody>
                {lista.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-200 dark:border-slate-800 odd:bg-slate-50 even:bg-slate-100 dark:odd:bg-slate-950/60 dark:even:bg-slate-900/40">
                    <td className="px-3 py-1.5 text-slate-900 dark:text-slate-100">
                      {item.cliente}
                    </td>
                    <td className="px-3 py-1.5 text-slate-900 dark:text-slate-100">
                      {item.tipo}
                    </td>
                    <td className="px-3 py-1.5 text-slate-900 dark:text-slate-100">
                      {item.valor.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                    <td className="px-3 py-1.5 text-slate-900 dark:text-slate-100">
                      {item.status}
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

