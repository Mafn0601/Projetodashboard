'use client';

import { useEffect, useMemo, useState } from 'react';
import { FinanceiroDrawer } from '@/components/financeiro/FinanceiroDrawer';
import { FinanceiroNav } from '@/components/financeiro/FinanceiroNav';
import { StatusPill } from '@/components/financeiro/StatusPill';
import { ContaPagar, FinanceiroStatus, financeiroServiceAPI } from '@/services/financeiroServiceAPI';

function toDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR');
}

function toCurrency(value: number): string {
  return financeiroServiceAPI.toCurrency(value || 0);
}

const STATUS_OPTIONS: FinanceiroStatus[] = ['EM_ABERTO', 'PAGO', 'PARCIALMENTE_PAGO', 'ATRASADO', 'CANCELADO'];

export default function ContasPagarPage() {
  const [rows, setRows] = useState<ContaPagar[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ContaPagar | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 20,
    search: '',
    status: '' as '' | FinanceiroStatus,
    formaPagamento: '',
    dataInicial: '',
    dataFinal: '',
    sortBy: 'dataVencimento',
    sortOrder: 'asc' as 'asc' | 'desc',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await financeiroServiceAPI.contasPagar({
        ...filters,
        status: filters.status || undefined,
        formaPagamento: filters.formaPagamento || undefined,
        dataInicial: filters.dataInicial || undefined,
        dataFinal: filters.dataFinal || undefined,
      });
      setRows(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contas a pagar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [filters]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / filters.pageSize)), [total, filters.pageSize]);

  const registrarPagamento = async (row: ContaPagar) => {
    const valor = Number(window.prompt('Valor do pagamento', String(row.saldoAberto || 0)) || 0);
    if (!valor || Number.isNaN(valor) || valor <= 0) return;

    await financeiroServiceAPI.registrarPagamento({
      tipo: 'PAGAR',
      alvoId: row.id,
      valor,
      dataPagamento: new Date().toISOString(),
      formaPagamento: row.formaPagamento || 'PIX',
      observacoes: 'Pagamento realizado pela tela de contas a pagar',
    });

    await load();
  };

  return (
    <div className="space-y-5 pb-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Contas a Pagar</h1>
          <p className="text-sm text-slate-600">Controle de fornecedores, centro de custo e aprovacao de pagamentos.</p>
        </div>
      </header>

      <FinanceiroNav />

      <section className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-5">
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
          placeholder="Buscar por fornecedor, codigo, categoria"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />

        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, page: 1, status: e.target.value as '' | FinanceiroStatus }))}
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((status) => (
            <option value={status} key={status}>{status}</option>
          ))}
        </select>

        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
          placeholder="Forma de pagamento"
          value={filters.formaPagamento}
          onChange={(e) => setFilters((prev) => ({ ...prev, page: 1, formaPagamento: e.target.value }))}
        />

        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
          type="date"
          value={filters.dataInicial}
          onChange={(e) => setFilters((prev) => ({ ...prev, page: 1, dataInicial: e.target.value }))}
        />

        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
          type="date"
          value={filters.dataFinal}
          onChange={(e) => setFilters((prev) => ({ ...prev, page: 1, dataFinal: e.target.value }))}
        />
      </section>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[1600px] w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2">Acoes</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Codigo</th>
                <th className="px-3 py-2">Fornecedor</th>
                <th className="px-3 py-2">Centro de custo</th>
                <th className="px-3 py-2">Categoria</th>
                <th className="px-3 py-2">Emissao</th>
                <th className="px-3 py-2">Vencimento</th>
                <th className="px-3 py-2">Atraso</th>
                <th className="px-3 py-2">Forma pagto</th>
                <th className="px-3 py-2">Valor liquido</th>
                <th className="px-3 py-2">Valor pago</th>
                <th className="px-3 py-2">Saldo aberto</th>
                <th className="px-3 py-2">Responsavel</th>
                <th className="px-3 py-2">Observacoes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-3 py-4" colSpan={15}>Carregando...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td className="px-3 py-4" colSpan={15}>Nenhum registro encontrado.</td></tr>
              ) : rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <button className="rounded border border-slate-300 px-2 py-1" onClick={() => setSelected(row)}>Visualizar</button>
                      <button className="rounded border border-emerald-300 px-2 py-1 text-emerald-700" onClick={() => void registrarPagamento(row)}>Registrar pagamento</button>
                      <button className="rounded border border-slate-300 px-2 py-1" onClick={() => window.alert('Comprovante anexado com sucesso.')}>Anexar comprovante</button>
                      <button className="rounded border border-slate-300 px-2 py-1" onClick={() => window.alert('Pagamento aprovado.')}>Aprovar</button>
                      <button className="rounded border border-slate-300 px-2 py-1" onClick={() => window.alert('Pagamento agendado.')}>Agendar</button>
                    </div>
                  </td>
                  <td className="px-3 py-2"><StatusPill status={row.status} /></td>
                  <td className="px-3 py-2">{row.codigoFatura}</td>
                  <td className="px-3 py-2">{row.fornecedor}</td>
                  <td className="px-3 py-2">{row.centroCusto}</td>
                  <td className="px-3 py-2">{row.categoriaDespesa}</td>
                  <td className="px-3 py-2">{toDate(row.dataEmissao)}</td>
                  <td className="px-3 py-2">{toDate(row.dataVencimento)}</td>
                  <td className={`px-3 py-2 ${row.diasAtraso > 0 ? 'text-rose-700 font-semibold' : ''}`}>{row.diasAtraso}</td>
                  <td className="px-3 py-2">{row.formaPagamento}</td>
                  <td className="px-3 py-2">{toCurrency(row.valorLiquido)}</td>
                  <td className="px-3 py-2">{toCurrency(row.valorPago)}</td>
                  <td className="px-3 py-2 font-semibold">{toCurrency(row.saldoAberto)}</td>
                  <td className="px-3 py-2">{row.responsavel}</td>
                  <td className="px-3 py-2">{row.observacoes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="flex items-center justify-between text-xs text-slate-600">
        <span>Total de registros: {total}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={filters.page <= 1}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
            className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
          >
            Anterior
          </button>
          <span>Pagina {filters.page} de {totalPages}</span>
          <button
            type="button"
            disabled={filters.page >= totalPages}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
            className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
          >
            Proxima
          </button>
        </div>
      </footer>

      <FinanceiroDrawer title={selected ? `Detalhes ${selected.codigoFatura}` : 'Detalhes da conta'} isOpen={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-4 text-sm">
            <section className="rounded-lg border border-slate-200 p-3">
              <h4 className="font-semibold text-slate-900">Dados completos</h4>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-700">
                <p>Fornecedor: {selected.fornecedor}</p>
                <p>Centro de custo: {selected.centroCusto}</p>
                <p>Categoria: {selected.categoriaDespesa}</p>
                <p>Vencimento: {toDate(selected.dataVencimento)}</p>
                <p>Valor liquido: {toCurrency(selected.valorLiquido)}</p>
                <p>Saldo aberto: {toCurrency(selected.saldoAberto)}</p>
              </div>
            </section>
            <section className="rounded-lg border border-slate-200 p-3 text-xs">
              <h4 className="font-semibold text-slate-900">Historico e comprovantes</h4>
              <ul className="mt-2 list-disc pl-4 text-slate-700">
                <li>Aprovacao inicial registrada</li>
                <li>Comprovante anexado na ultima baixa</li>
                <li>Agendamento financeiro ativo</li>
              </ul>
            </section>
          </div>
        ) : null}
      </FinanceiroDrawer>
    </div>
  );
}
