'use client';

import { useEffect, useMemo, useState } from 'react';
import { FinanceiroDrawer } from '@/components/financeiro/FinanceiroDrawer';
import { FinanceiroNav } from '@/components/financeiro/FinanceiroNav';
import { StatusPill } from '@/components/financeiro/StatusPill';
import { ContaReceber, FinanceiroStatus, financeiroServiceAPI } from '@/services/financeiroServiceAPI';

function toDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR');
}

function toCurrency(value: number): string {
  return financeiroServiceAPI.toCurrency(value || 0);
}

const STATUS_OPTIONS: FinanceiroStatus[] = ['EM_ABERTO', 'PAGO', 'PARCIALMENTE_PAGO', 'ATRASADO', 'CANCELADO'];

export default function ContasReceberPage() {
  const [rows, setRows] = useState<ContaReceber[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ContaReceber | null>(null);
  const [isEditingSelected, setIsEditingSelected] = useState(false);
  const [selectedObservacoes, setSelectedObservacoes] = useState('');
  const [selectedVencimento, setSelectedVencimento] = useState('');
  const [selectedFormaPagamento, setSelectedFormaPagamento] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [searchInput, setSearchInput] = useState('');

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 20,
    search: '',
    status: '' as '' | FinanceiroStatus,
    formaPagamento: '',
    minValor: '',
    maxValor: '',
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
      const result = await financeiroServiceAPI.contasReceber({
        ...filters,
        status: filters.status || undefined,
        minValor: filters.minValor ? Number(filters.minValor) : undefined,
        maxValor: filters.maxValor ? Number(filters.maxValor) : undefined,
        dataInicial: filters.dataInicial || undefined,
        dataFinal: filters.dataFinal || undefined,
        formaPagamento: filters.formaPagamento || undefined,
      });

      setRows(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contas a receber');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [filters]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / filters.pageSize)), [total, filters.pageSize]);

  const selectedIds = Object.entries(checked)
    .filter(([, isChecked]) => isChecked)
    .map(([id]) => id);

  const handleBulkCobrar = () => {
    if (selectedIds.length === 0) return;
    setActionMessage(`Cobrança disparada para ${selectedIds.length} faturas selecionadas.`);
  };

  const handleBulkBoleto = () => {
    if (selectedIds.length === 0) return;

    const selecionadas = rows.filter((item) => selectedIds.includes(item.id));
    const conteudo = selecionadas
      .map((item) => `${item.codigoFatura} | ${item.cliente} | ${toCurrency(item.saldoAberto)} | venc.: ${toDate(item.dataVencimento)}`)
      .join('\n');

    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `boletos-lote-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    setActionMessage(`Arquivo de boletos em lote gerado (${selecionadas.length} registros).`);
  };

  const registrarPagamento = async (row: ContaReceber) => {
    const valor = Number(window.prompt('Valor recebido', String(row.saldoAberto || 0)) || 0);
    if (!valor || Number.isNaN(valor) || valor <= 0) return;

    await financeiroServiceAPI.registrarPagamento({
      tipo: 'RECEBER',
      alvoId: row.id,
      valor,
      dataPagamento: new Date().toISOString(),
      formaPagamento: row.formaPagamento || 'PIX',
      observacoes: 'Pagamento registrado pela tela de contas a receber',
    });

    await load();
  };

  const enviarCobranca = async (row: ContaReceber) => {
    const mensagem = `Olá, identificamos a fatura ${row.codigoFatura} em aberto no valor de ${toCurrency(row.saldoAberto)}. Vencimento: ${toDate(row.dataVencimento)}.`;

    try {
      await navigator.clipboard.writeText(mensagem);
      setActionMessage(`Mensagem de cobrança copiada para a área de transferência (${row.codigoFatura}).`);
    } catch {
      window.alert(mensagem);
      setActionMessage(`Mensagem de cobrança exibida para ${row.codigoFatura}.`);
    }
  };

  const gerarBoleto = (row: ContaReceber) => {
    const conteudo = [
      `Boleto Simulado - ${row.codigoFatura}`,
      `Sacado: ${row.cliente}`,
      `Documento: ${row.cnpjCpf}`,
      `Vencimento: ${toDate(row.dataVencimento)}`,
      `Valor: ${toCurrency(row.saldoAberto)}`,
      `Forma de pagamento: ${row.formaPagamento}`,
    ].join('\n');

    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `boleto-${row.codigoFatura}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setActionMessage(`Boleto gerado para ${row.codigoFatura}.`);
  };

  const duplicarFatura = async (row: ContaReceber) => {
    await financeiroServiceAPI.criarFatura({
      tipo: 'RECEBER',
      nome: row.cliente,
      documento: row.cnpjCpf,
      dataEmissao: new Date().toISOString(),
      dataVencimento: row.dataVencimento,
      formaPagamento: row.formaPagamento,
      valorBruto: row.valorBruto,
      desconto: row.desconto,
      responsavel: row.responsavel,
      observacoes: `Duplicada de ${row.codigoFatura}`,
    });

    setActionMessage(`Fatura ${row.codigoFatura} duplicada com sucesso.`);
    await load();
  };

  const cancelarFatura = async (row: ContaReceber) => {
    await financeiroServiceAPI.atualizarFatura(row.id, { status: 'CANCELADO' });
    setActionMessage(`Fatura ${row.codigoFatura} marcada como cancelada.`);
    await load();
  };

  const openDrawer = (row: ContaReceber) => {
    setSelected(row);
    setIsEditingSelected(false);
    setSelectedObservacoes(row.observacoes || '');
    setSelectedVencimento(row.dataVencimento.slice(0, 10));
    setSelectedFormaPagamento(row.formaPagamento || '');
  };

  const salvarEdicaoSelecionada = async () => {
    if (!selected) return;

    await financeiroServiceAPI.atualizarFatura(selected.id, {
      observacoes: selectedObservacoes,
      dataVencimento: selectedVencimento ? new Date(`${selectedVencimento}T12:00:00`).toISOString() : undefined,
      formaPagamento: selectedFormaPagamento,
    });

    setActionMessage(`Fatura ${selected.codigoFatura} atualizada.`);
    setIsEditingSelected(false);
    await load();
  };

  return (
    <div className="space-y-5 pb-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Contas a Receber</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">Operacao financeira com filtros avancados, acoes em lote e detalhamento lateral.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBulkCobrar}
            disabled={selectedIds.length === 0}
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            Enviar cobranca em lote
          </button>
          <button
            type="button"
            onClick={handleBulkBoleto}
            disabled={selectedIds.length === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
          >
            Gerar boleto
          </button>
        </div>
      </header>

      <FinanceiroNav />

      <section className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-5 dark:border-slate-700 dark:bg-slate-900">
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          placeholder="Buscar por cliente, codigo, documento"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />

        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, page: 1, status: e.target.value as '' | FinanceiroStatus }))}
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((status) => (
            <option value={status} key={status}>{status}</option>
          ))}
        </select>

        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          placeholder="Forma de pagamento"
          value={filters.formaPagamento}
          onChange={(e) => setFilters((prev) => ({ ...prev, page: 1, formaPagamento: e.target.value }))}
        />

        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          type="date"
          value={filters.dataInicial}
          onChange={(e) => setFilters((prev) => ({ ...prev, page: 1, dataInicial: e.target.value }))}
        />

        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          type="date"
          value={filters.dataFinal}
          onChange={(e) => setFilters((prev) => ({ ...prev, page: 1, dataFinal: e.target.value }))}
        />

        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          type="number"
          placeholder="Valor minimo"
          value={filters.minValor}
          onChange={(e) => setFilters((prev) => ({ ...prev, page: 1, minValor: e.target.value }))}
        />

        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          type="number"
          placeholder="Valor maximo"
          value={filters.maxValor}
          onChange={(e) => setFilters((prev) => ({ ...prev, page: 1, maxValor: e.target.value }))}
        />
      </section>

      {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
      {actionMessage ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{actionMessage}</p> : null}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-[1800px] w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <tr>
                <th className="px-3 py-2"><input type="checkbox" onChange={(e) => {
                  const isChecked = e.target.checked;
                  const next: Record<string, boolean> = {};
                  rows.forEach((item) => {
                    next[item.id] = isChecked;
                  });
                  setChecked(next);
                }} /></th>
                <th className="px-3 py-2">Acoes</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Codigo da fatura</th>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">CNPJ/CPF</th>
                <th className="px-3 py-2">Data emissao</th>
                <th className="px-3 py-2">Data vencimento</th>
                <th className="px-3 py-2">Dias em atraso</th>
                <th className="px-3 py-2">Forma de pagamento</th>
                <th className="px-3 py-2">Valor bruto</th>
                <th className="px-3 py-2">Desconto</th>
                <th className="px-3 py-2">Valor liquido</th>
                <th className="px-3 py-2">Valor recebido</th>
                <th className="px-3 py-2">Saldo em aberto</th>
                <th className="px-3 py-2">Responsavel</th>
                <th className="px-3 py-2">Observacoes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-3 py-4" colSpan={17}>Carregando...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td className="px-3 py-4" colSpan={17}>Nenhum registro encontrado.</td></tr>
              ) : rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={Boolean(checked[row.id])}
                      onChange={(e) => setChecked((prev) => ({ ...prev, [row.id]: e.target.checked }))}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="grid grid-cols-2 gap-1 xl:grid-cols-3">
                      <button className="h-7 rounded border border-slate-300 px-2 text-[11px] dark:border-slate-700" onClick={() => openDrawer(row)}>Visualizar</button>
                      <button className="h-7 rounded border border-slate-300 px-2 text-[11px] dark:border-slate-700" onClick={() => { openDrawer(row); setIsEditingSelected(true); }}>Editar</button>
                      <button className="h-7 rounded border border-emerald-300 px-2 text-[11px] text-emerald-700 dark:border-emerald-700 dark:text-emerald-300" onClick={() => void registrarPagamento(row)}>Registrar pagamento</button>
                      <button className="h-7 rounded border border-slate-300 px-2 text-[11px] dark:border-slate-700" onClick={() => void enviarCobranca(row)}>Enviar cobranca</button>
                      <button className="h-7 rounded border border-slate-300 px-2 text-[11px] dark:border-slate-700" onClick={() => gerarBoleto(row)}>Gerar boleto</button>
                      <button className="h-7 rounded border border-slate-300 px-2 text-[11px] dark:border-slate-700" onClick={() => void duplicarFatura(row)}>Duplicar</button>
                      <button className="h-7 rounded border border-rose-300 px-2 text-[11px] text-rose-700 dark:border-rose-700 dark:text-rose-300 xl:col-span-3" onClick={() => void cancelarFatura(row)}>Cancelar</button>
                    </div>
                  </td>
                  <td className="px-3 py-2"><StatusPill status={row.status} /></td>
                  <td className="px-3 py-2">{row.codigoFatura}</td>
                  <td className="px-3 py-2">{row.cliente}</td>
                  <td className="px-3 py-2">{row.cnpjCpf}</td>
                  <td className="px-3 py-2">{toDate(row.dataEmissao)}</td>
                  <td className="px-3 py-2">{toDate(row.dataVencimento)}</td>
                  <td className={`px-3 py-2 ${row.diasAtraso > 0 ? 'text-rose-700 dark:text-rose-300 font-semibold' : ''}`}>{row.diasAtraso}</td>
                  <td className="px-3 py-2">{row.formaPagamento}</td>
                  <td className="px-3 py-2">{toCurrency(row.valorBruto)}</td>
                  <td className="px-3 py-2">{toCurrency(row.desconto)}</td>
                  <td className="px-3 py-2">{toCurrency(row.valorLiquido)}</td>
                  <td className="px-3 py-2">{toCurrency(row.valorRecebido)}</td>
                  <td className="px-3 py-2 font-semibold">{toCurrency(row.saldoAberto)}</td>
                  <td className="px-3 py-2">{row.responsavel}</td>
                  <td className="px-3 py-2">{row.observacoes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
        <span>Total de registros: {total}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={filters.page <= 1}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
            className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50 dark:border-slate-700"
          >
            Anterior
          </button>
          <span>Pagina {filters.page} de {totalPages}</span>
          <button
            type="button"
            disabled={filters.page >= totalPages}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
            className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50 dark:border-slate-700"
          >
            Proxima
          </button>
        </div>
      </footer>

      <FinanceiroDrawer title={selected ? `Detalhes da fatura ${selected.codigoFatura}` : 'Detalhes da fatura'} isOpen={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-4 text-sm">
            {isEditingSelected ? (
              <section className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs dark:border-sky-800 dark:bg-sky-950/20">
                <h4 className="font-semibold text-sky-800 dark:text-sky-200">Edição rápida</h4>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <input
                    className="rounded border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    type="date"
                    value={selectedVencimento}
                    onChange={(e) => setSelectedVencimento(e.target.value)}
                  />
                  <input
                    className="rounded border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    value={selectedFormaPagamento}
                    onChange={(e) => setSelectedFormaPagamento(e.target.value)}
                    placeholder="Forma de pagamento"
                  />
                  <textarea
                    className="rounded border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    rows={3}
                    value={selectedObservacoes}
                    onChange={(e) => setSelectedObservacoes(e.target.value)}
                    placeholder="Observações"
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <button className="rounded bg-slate-900 px-2 py-1 text-white" onClick={() => void salvarEdicaoSelecionada()}>Salvar</button>
                  <button className="rounded border border-slate-300 px-2 py-1 dark:border-slate-700" onClick={() => setIsEditingSelected(false)}>Cancelar edição</button>
                </div>
              </section>
            ) : null}

            <section className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Dados completos</h4>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
                <p>Cliente: {selected.cliente}</p>
                <p>Documento: {selected.cnpjCpf}</p>
                <p>Emissao: {toDate(selected.dataEmissao)}</p>
                <p>Vencimento: {toDate(selected.dataVencimento)}</p>
                <p>Valor liquido: {toCurrency(selected.valorLiquido)}</p>
                <p>Saldo aberto: {toCurrency(selected.saldoAberto)}</p>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Historico de pagamentos</h4>
              <ul className="mt-2 list-disc pl-4 text-slate-700 dark:text-slate-300">
                <li>Pagamento parcial registrado automaticamente</li>
                <li>Ultima conciliacao executada no fechamento diario</li>
              </ul>
            </section>

            <section className="rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Historico de alteracoes</h4>
              <ul className="mt-2 list-disc pl-4 text-slate-700 dark:text-slate-300">
                <li>Status atualizado para {selected.status}</li>
                <li>Responsavel: {selected.responsavel}</li>
              </ul>
            </section>

            <section className="rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Arquivos anexados</h4>
              <p className="mt-2 text-slate-700 dark:text-slate-300">Nenhum anexo enviado para esta fatura.</p>
            </section>

            <section className="rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Timeline de eventos</h4>
              <ol className="mt-2 space-y-1 text-slate-700 dark:text-slate-300">
                <li>1. Fatura emitida</li>
                <li>2. Alerta de vencimento disparado</li>
                <li>3. Ultima interacao registrada pelo financeiro</li>
              </ol>
            </section>
          </div>
        ) : null}
      </FinanceiroDrawer>
    </div>
  );
}
