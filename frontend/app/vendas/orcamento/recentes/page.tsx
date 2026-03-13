'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { OrcamentoAPI, orcamentoServiceAPI } from '@/services/orcamentoServiceAPI';
import { formatDateInBrasilia } from '@/lib/dateUtils';

export default function OrcamentosRecentesPage() {
  const router = useRouter();
  const [orcamentosRecentes, setOrcamentosRecentes] = useState<OrcamentoAPI[]>([]);
  const [carregandoOrcamentos, setCarregandoOrcamentos] = useState(false);

  const carregarOrcamentos = async () => {
    try {
      setCarregandoOrcamentos(true);
      const data = await orcamentoServiceAPI.findAll({ take: 50 });
      setOrcamentosRecentes(data || []);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
      setOrcamentosRecentes([]);
    } finally {
      setCarregandoOrcamentos(false);
    }
  };

  useEffect(() => {
    carregarOrcamentos();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Orçamentos recentes</h1>
          <p className="text-sm text-slate-700 dark:text-slate-300">Histórico dos últimos orçamentos cadastrados.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={carregarOrcamentos}>
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/vendas/orcamento')}>
            Voltar para Orçamento
          </Button>
        </div>
      </div>

      <section className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        {carregandoOrcamentos ? (
          <p className="text-sm text-slate-700 dark:text-slate-400">Carregando...</p>
        ) : orcamentosRecentes.length === 0 ? (
          <p className="text-sm text-slate-700 dark:text-slate-400">Nenhum orçamento cadastrado.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="scrollbar-thin max-h-[70vh] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-medium">Número</th>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Valor (R$)</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Validade</th>
                  </tr>
                </thead>
                <tbody>
                  {orcamentosRecentes.map((orc) => (
                    <tr
                      key={orc.id}
                      className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-700/40"
                    >
                      <td className="px-4 py-2 text-slate-900 dark:text-slate-100">{orc.numeroOrcamento}</td>
                      <td className="px-4 py-2 text-slate-900 dark:text-slate-100">{orc.cliente?.nome || '-'}</td>
                      <td className="px-4 py-2 text-slate-900 dark:text-slate-100">
                        {Number(orc.valorTotal || 0).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-2 text-slate-900 dark:text-slate-100">{orc.status}</td>
                      <td className="px-4 py-2 text-slate-900 dark:text-slate-100">
                        {orc.validade ? formatDateInBrasilia(orc.validade) : '-'}
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
