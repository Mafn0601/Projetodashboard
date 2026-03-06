'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function ExcelPage() {
  const [arquivo, setArquivo] = useState<File | null>(null);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Espaço Excel</h1>
        <p className="text-xs text-slate-700 dark:text-slate-400">
          Área inicial para upload e manipulação futura de planilhas.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
            Upload de planilha
          </label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setArquivo(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-950/50">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {arquivo
              ? `Arquivo selecionado: ${arquivo.name}`
              : 'Nenhum arquivo selecionado. Estrutura pronta para processamento futuro.'}
          </p>
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" disabled={!arquivo}>
            Preparar importação
          </Button>
        </div>
      </section>
    </div>
  );
}
