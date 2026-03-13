'use client';

import { useEffect, useState } from 'react';
import { FinanceiroNav } from '@/components/financeiro/FinanceiroNav';
import { financeiroServiceAPI } from '@/services/financeiroServiceAPI';

type TipoRelatorio = 'contas-receber' | 'contas-atraso' | 'faturamento-cliente' | 'faturamento-mensal' | 'despesas-categoria';

const relatorios: Array<{ value: TipoRelatorio; label: string }> = [
  { value: 'contas-receber', label: 'Contas a receber por periodo' },
  { value: 'contas-atraso', label: 'Contas em atraso' },
  { value: 'faturamento-cliente', label: 'Faturamento por cliente' },
  { value: 'faturamento-mensal', label: 'Faturamento mensal' },
  { value: 'despesas-categoria', label: 'Despesas por categoria' },
];

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function RelatoriosFinanceirosPage() {
  const [tipo, setTipo] = useState<TipoRelatorio>('contas-receber');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await financeiroServiceAPI.relatorios({
        tipo,
        dataInicial: dataInicial || undefined,
        dataFinal: dataFinal || undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar relatorio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [tipo, dataInicial, dataFinal]);

  const exportCSV = () => {
    const rows = result?.rows || [];
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);
    const lines = [headers.join(',')];

    for (const row of rows) {
      lines.push(headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','));
    }

    downloadBlob(`relatorio-${tipo}.csv`, lines.join('\n'), 'text/csv;charset=utf-8;');
  };

  const exportExcel = () => {
    const rows = result?.rows || [];
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);
    const lines = [headers.join('\t')];

    for (const row of rows) {
      lines.push(headers.map((h) => String(row[h] ?? '')).join('\t'));
    }

    downloadBlob(`relatorio-${tipo}.xls`, lines.join('\n'), 'application/vnd.ms-excel');
  };

  const exportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-5 pb-10">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Relatorios Financeiros</h1>
        <p className="text-sm text-slate-600">Analise consolidada com exportacao em Excel, CSV e PDF.</p>
      </header>

      <FinanceiroNav />

      <section className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <select className="rounded-lg border border-slate-300 px-3 py-2 text-xs" value={tipo} onChange={(e) => setTipo(e.target.value as TipoRelatorio)}>
          {relatorios.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-xs" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-xs" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
        <div className="flex gap-2">
          <button type="button" className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold" onClick={exportExcel}>Excel</button>
          <button type="button" className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold" onClick={exportCSV}>CSV</button>
          <button type="button" className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold" onClick={exportPDF}>PDF</button>
        </div>
      </section>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">{result?.titulo || 'Relatorio'}</h2>
        {loading ? <p className="mt-3 text-xs text-slate-500">Carregando...</p> : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-[800px] w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  {Object.keys(result?.rows?.[0] || { info: '' }).map((header) => (
                    <th key={header} className="px-3 py-2">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(result?.rows || []).map((row: any, index: number) => (
                  <tr key={index} className="border-t border-slate-200">
                    {Object.keys(result?.rows?.[0] || { info: '' }).map((header) => (
                      <td key={header} className="px-3 py-2">{String(row[header] ?? '-')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
