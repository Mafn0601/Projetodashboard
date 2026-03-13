import prisma from '../../../lib/prisma';

type FinanceiroStatus = 'EM_ABERTO' | 'PAGO' | 'PARCIALMENTE_PAGO' | 'ATRASADO' | 'CANCELADO';
type FinanceiroTipo = 'RECEBER' | 'PAGAR';

type ContaReceber = {
  id: string;
  codigoFatura: string;
  status: FinanceiroStatus;
  cliente: string;
  cnpjCpf: string;
  dataEmissao: string;
  dataVencimento: string;
  diasAtraso: number;
  formaPagamento: string;
  valorBruto: number;
  desconto: number;
  valorLiquido: number;
  valorRecebido: number;
  saldoAberto: number;
  responsavel: string;
  observacoes: string;
  origem: 'OS' | 'MANUAL';
};

type ContaPagar = {
  id: string;
  codigoFatura: string;
  status: FinanceiroStatus;
  fornecedor: string;
  centroCusto: string;
  categoriaDespesa: string;
  dataEmissao: string;
  dataVencimento: string;
  diasAtraso: number;
  formaPagamento: string;
  valorBruto: number;
  desconto: number;
  valorLiquido: number;
  valorPago: number;
  saldoAberto: number;
  responsavel: string;
  observacoes: string;
};

type Pagamento = {
  id: string;
  tipo: FinanceiroTipo;
  alvoId: string;
  valor: number;
  dataPagamento: string;
  formaPagamento: string;
  observacoes?: string;
  comprovanteUrl?: string;
  aprovado?: boolean;
  createdAt: string;
  updatedAt: string;
};

type FaturaManual = {
  id: string;
  tipo: FinanceiroTipo;
  codigoFatura: string;
  status: FinanceiroStatus;
  nome: string;
  documento: string;
  dataEmissao: string;
  dataVencimento: string;
  formaPagamento: string;
  valorBruto: number;
  desconto: number;
  responsavel: string;
  observacoes: string;
  categoria?: string;
  centroCusto?: string;
  createdAt: string;
  updatedAt: string;
};

type ListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  status?: FinanceiroStatus;
  formaPagamento?: string;
  minValor?: number;
  maxValor?: number;
  dataInicial?: string;
  dataFinal?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

const faturasManuais: FaturaManual[] = [];
const pagamentosStore: Pagamento[] = [];

const contasPagarStore: Omit<ContaPagar, 'diasAtraso' | 'status' | 'valorPago' | 'saldoAberto'>[] = [
  {
    id: 'cp-1',
    codigoFatura: 'CP-2026-0001',
    fornecedor: 'Fornecedor Alpha',
    centroCusto: 'Operacao',
    categoriaDespesa: 'Insumos',
    dataEmissao: new Date(Date.now() - 12 * 86400000).toISOString(),
    dataVencimento: new Date(Date.now() - 2 * 86400000).toISOString(),
    formaPagamento: 'PIX',
    valorBruto: 3800,
    desconto: 100,
    valorLiquido: 3700,
    responsavel: 'Financeiro',
    observacoes: 'Compra recorrente mensal',
  },
  {
    id: 'cp-2',
    codigoFatura: 'CP-2026-0002',
    fornecedor: 'Fornecedor Beta',
    centroCusto: 'Administrativo',
    categoriaDespesa: 'SaaS',
    dataEmissao: new Date(Date.now() - 5 * 86400000).toISOString(),
    dataVencimento: new Date(Date.now() + 4 * 86400000).toISOString(),
    formaPagamento: 'BOLETO',
    valorBruto: 990,
    desconto: 0,
    valorLiquido: 990,
    responsavel: 'Financeiro',
    observacoes: 'Renovacao anual de plataforma',
  },
];

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function startOfDayISO(value: string): string {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function endOfDayISO(value: string): string {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

function diffDays(now: Date, targetISO: string): number {
  const target = new Date(targetISO);
  const diffMs = now.getTime() - target.getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
}

function monthBounds(reference = new Date()): { start: Date; end: Date } {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function buildStatus(valorLiquido: number, pago: number, vencimento: string, manualStatus?: FinanceiroStatus): FinanceiroStatus {
  if (manualStatus === 'CANCELADO') return 'CANCELADO';
  if (pago >= valorLiquido) return 'PAGO';
  if (pago > 0 && pago < valorLiquido) return 'PARCIALMENTE_PAGO';
  if (new Date(vencimento).getTime() < Date.now()) return 'ATRASADO';
  return 'EM_ABERTO';
}

function sumPagamentos(tipo: FinanceiroTipo, alvoId: string): number {
  return pagamentosStore
    .filter((item) => item.tipo === tipo && item.alvoId === alvoId)
    .reduce((acc, curr) => acc + curr.valor, 0);
}

function applyListFilters<T extends { status: FinanceiroStatus; formaPagamento: string; valorLiquido: number; dataVencimento: string }>(
  rows: T[],
  query: ListQuery,
  searchableValues: (item: T) => string
): T[] {
  return rows.filter((item) => {
    if (query.search) {
      const bucket = normalizeText(searchableValues(item));
      if (!bucket.includes(normalizeText(query.search))) return false;
    }

    if (query.status && item.status !== query.status) return false;

    if (query.formaPagamento && normalizeText(item.formaPagamento) !== normalizeText(query.formaPagamento)) {
      return false;
    }

    if (query.minValor !== undefined && item.valorLiquido < query.minValor) return false;
    if (query.maxValor !== undefined && item.valorLiquido > query.maxValor) return false;

    if (query.dataInicial && item.dataVencimento < startOfDayISO(query.dataInicial)) return false;
    if (query.dataFinal && item.dataVencimento > endOfDayISO(query.dataFinal)) return false;

    return true;
  });
}

function applySortAndPagination<T extends Record<string, unknown>>(rows: T[], query: ListQuery): { data: T[]; total: number } {
  const sortBy = query.sortBy || 'dataVencimento';
  const sortOrder = query.sortOrder || 'asc';

  const sorted = [...rows].sort((a, b) => {
    const va = a[sortBy];
    const vb = b[sortBy];

    if (typeof va === 'number' && typeof vb === 'number') {
      return sortOrder === 'asc' ? va - vb : vb - va;
    }

    const sa = String(va ?? '');
    const sb = String(vb ?? '');
    return sortOrder === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
  });

  const total = sorted.length;
  const start = (query.page - 1) * query.pageSize;
  const data = sorted.slice(start, start + query.pageSize);

  return { data, total };
}

export class FinanceiroRepository {
  async listContasReceber(query: ListQuery): Promise<{ data: ContaReceber[]; total: number }> {
    const ordens = await prisma.ordemServico.findMany({
      where: {
        valorTotal: {
          not: null,
        },
      },
      select: {
        id: true,
        numeroOS: true,
        formaPagamento: true,
        valorTotal: true,
        valorDesconto: true,
        dataAbertura: true,
        dataPrevisao: true,
        observacoes: true,
        cliente: {
          select: {
            nome: true,
            cpfCnpj: true,
          },
        },
        responsavel: {
          select: {
            nome: true,
            login: true,
          },
        },
      },
      orderBy: {
        dataAbertura: 'desc',
      },
      take: 500,
    });

    const now = new Date();

    const baseRows: ContaReceber[] = ordens.map((os) => {
      const valorBruto = Number(os.valorTotal || 0);
      const desconto = Number(os.valorDesconto || 0);
      const valorLiquido = Math.max(0, valorBruto - desconto);
      const valorRecebido = sumPagamentos('RECEBER', os.id);
      const saldoAberto = Math.max(0, valorLiquido - valorRecebido);
      const dataEmissao = os.dataAbertura.toISOString();
      const dataVencimento = (os.dataPrevisao || new Date(os.dataAbertura.getTime() + 15 * 86400000)).toISOString();
      const status = buildStatus(valorLiquido, valorRecebido, dataVencimento);

      return {
        id: os.id,
        codigoFatura: `FR-${os.numeroOS}`,
        status,
        cliente: os.cliente?.nome || 'Cliente nao informado',
        cnpjCpf: os.cliente?.cpfCnpj || '-',
        dataEmissao,
        dataVencimento,
        diasAtraso: status === 'ATRASADO' ? diffDays(now, dataVencimento) : 0,
        formaPagamento: os.formaPagamento || 'NAO_INFORMADO',
        valorBruto,
        desconto,
        valorLiquido,
        valorRecebido,
        saldoAberto,
        responsavel: os.responsavel?.nome || os.responsavel?.login || '-',
        observacoes: os.observacoes || '-',
        origem: 'OS',
      };
    });

    const manuais = faturasManuais
      .filter((item) => item.tipo === 'RECEBER')
      .map<ContaReceber>((item) => {
        const valorLiquido = Math.max(0, item.valorBruto - item.desconto);
        const valorRecebido = sumPagamentos('RECEBER', item.id);
        const saldoAberto = Math.max(0, valorLiquido - valorRecebido);
        const status = buildStatus(valorLiquido, valorRecebido, item.dataVencimento, item.status);

        return {
          id: item.id,
          codigoFatura: item.codigoFatura,
          status,
          cliente: item.nome,
          cnpjCpf: item.documento || '-',
          dataEmissao: item.dataEmissao,
          dataVencimento: item.dataVencimento,
          diasAtraso: status === 'ATRASADO' ? diffDays(now, item.dataVencimento) : 0,
          formaPagamento: item.formaPagamento,
          valorBruto: item.valorBruto,
          desconto: item.desconto,
          valorLiquido,
          valorRecebido,
          saldoAberto,
          responsavel: item.responsavel,
          observacoes: item.observacoes || '-',
          origem: 'MANUAL',
        };
      });

    const merged = [...baseRows, ...manuais];

    const filtered = applyListFilters(merged, query, (item) => `${item.codigoFatura} ${item.cliente} ${item.cnpjCpf} ${item.responsavel} ${item.observacoes}`);

    return applySortAndPagination(filtered, query);
  }

  async listContasPagar(query: ListQuery): Promise<{ data: ContaPagar[]; total: number }> {
    const now = new Date();

    const fromStore = contasPagarStore.map<ContaPagar>((item) => {
      const valorPago = sumPagamentos('PAGAR', item.id);
      const saldoAberto = Math.max(0, item.valorLiquido - valorPago);
      const status = buildStatus(item.valorLiquido, valorPago, item.dataVencimento);

      return {
        ...item,
        status,
        valorPago,
        saldoAberto,
        diasAtraso: status === 'ATRASADO' ? diffDays(now, item.dataVencimento) : 0,
      };
    });

    const manuais = faturasManuais
      .filter((item) => item.tipo === 'PAGAR')
      .map<ContaPagar>((item) => {
        const valorLiquido = Math.max(0, item.valorBruto - item.desconto);
        const valorPago = sumPagamentos('PAGAR', item.id);
        const saldoAberto = Math.max(0, valorLiquido - valorPago);
        const status = buildStatus(valorLiquido, valorPago, item.dataVencimento, item.status);

        return {
          id: item.id,
          codigoFatura: item.codigoFatura,
          status,
          fornecedor: item.nome,
          centroCusto: item.centroCusto || 'Geral',
          categoriaDespesa: item.categoria || 'Outros',
          dataEmissao: item.dataEmissao,
          dataVencimento: item.dataVencimento,
          diasAtraso: status === 'ATRASADO' ? diffDays(now, item.dataVencimento) : 0,
          formaPagamento: item.formaPagamento,
          valorBruto: item.valorBruto,
          desconto: item.desconto,
          valorLiquido,
          valorPago,
          saldoAberto,
          responsavel: item.responsavel,
          observacoes: item.observacoes || '-',
        };
      });

    const merged = [...fromStore, ...manuais];

    const filtered = applyListFilters(merged, query, (item) => `${item.codigoFatura} ${item.fornecedor} ${item.centroCusto} ${item.categoriaDespesa} ${item.responsavel} ${item.observacoes}`);

    return applySortAndPagination(filtered, query);
  }

  async createFatura(payload: {
    tipo: FinanceiroTipo;
    nome: string;
    documento?: string;
    dataEmissao: string;
    dataVencimento: string;
    formaPagamento: string;
    valorBruto: number;
    desconto?: number;
    responsavel?: string;
    observacoes?: string;
    categoria?: string;
    centroCusto?: string;
  }): Promise<FaturaManual> {
    const id = `fat-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const seq = String(faturasManuais.length + 1).padStart(4, '0');

    const item: FaturaManual = {
      id,
      tipo: payload.tipo,
      codigoFatura: `${payload.tipo === 'RECEBER' ? 'FR' : 'FP'}-2026-${seq}`,
      status: 'EM_ABERTO',
      nome: payload.nome,
      documento: payload.documento || '-',
      dataEmissao: payload.dataEmissao,
      dataVencimento: payload.dataVencimento,
      formaPagamento: payload.formaPagamento,
      valorBruto: payload.valorBruto,
      desconto: payload.desconto || 0,
      responsavel: payload.responsavel || 'Financeiro',
      observacoes: payload.observacoes || '-',
      categoria: payload.categoria,
      centroCusto: payload.centroCusto,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    faturasManuais.unshift(item);
    return item;
  }

  async updateFatura(id: string, payload: Partial<FaturaManual>): Promise<FaturaManual | null> {
    const index = faturasManuais.findIndex((item) => item.id === id);
    if (index === -1) return null;

    faturasManuais[index] = {
      ...faturasManuais[index],
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    return faturasManuais[index];
  }

  async createPagamento(payload: Omit<Pagamento, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pagamento> {
    const item: Pagamento = {
      ...payload,
      id: `pag-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    pagamentosStore.unshift(item);
    return item;
  }

  async updatePagamento(id: string, payload: Partial<Pagamento>): Promise<Pagamento | null> {
    const index = pagamentosStore.findIndex((item) => item.id === id);
    if (index === -1) return null;

    pagamentosStore[index] = {
      ...pagamentosStore[index],
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    return pagamentosStore[index];
  }

  async dashboard(): Promise<Record<string, unknown>> {
    const [receber, pagar] = await Promise.all([
      this.listContasReceber({ page: 1, pageSize: 1000 }),
      this.listContasPagar({ page: 1, pageSize: 1000 }),
    ]);

    const now = new Date();
    const { start, end } = monthBounds(now);

    const totalReceber = receber.data.reduce((acc, item) => acc + item.saldoAberto, 0);
    const totalPagar = pagar.data.reduce((acc, item) => acc + item.saldoAberto, 0);

    const recebimentosMes = pagamentosStore
      .filter((item) => item.tipo === 'RECEBER')
      .filter((item) => {
        const d = new Date(item.dataPagamento);
        return d >= start && d <= end;
      })
      .reduce((acc, item) => acc + item.valor, 0);

    const pagamentosMes = pagamentosStore
      .filter((item) => item.tipo === 'PAGAR')
      .filter((item) => {
        const d = new Date(item.dataPagamento);
        return d >= start && d <= end;
      })
      .reduce((acc, item) => acc + item.valor, 0);

    const valoresAtraso = [
      ...receber.data.filter((item) => item.status === 'ATRASADO').map((item) => item.saldoAberto),
      ...pagar.data.filter((item) => item.status === 'ATRASADO').map((item) => item.saldoAberto),
    ].reduce((acc, v) => acc + v, 0);

    const previsaoCaixa = totalReceber - totalPagar;
    const saldoAtual = recebimentosMes - pagamentosMes;

    const ultimosRecebimentos = pagamentosStore
      .filter((item) => item.tipo === 'RECEBER')
      .slice(0, 8);

    const ultimosPagamentos = pagamentosStore
      .filter((item) => item.tipo === 'PAGAR')
      .slice(0, 8);

    const hoje = now.toISOString().slice(0, 10);

    const vencendoHoje = receber.data.filter((item) => item.dataVencimento.slice(0, 10) === hoje).slice(0, 8);
    const emAtraso = receber.data.filter((item) => item.status === 'ATRASADO').slice(0, 8);

    return {
      cards: {
        totalReceber,
        totalPagar,
        saldoAtual,
        recebimentosMes,
        pagamentosMes,
        valoresAtraso,
        previsaoCaixa,
      },
      listasRapidas: {
        vencendoHoje,
        emAtraso,
        ultimosRecebimentos,
        ultimosPagamentos,
      },
    };
  }

  async fluxoCaixa(payload: { dataInicial?: string; dataFinal?: string; categoria?: string; contaBancaria?: string }) {
    const final = payload.dataFinal ? new Date(payload.dataFinal) : new Date();
    const inicial = payload.dataInicial
      ? new Date(payload.dataInicial)
      : new Date(final.getTime() - 29 * 86400000);

    inicial.setHours(0, 0, 0, 0);
    final.setHours(23, 59, 59, 999);

    const entries = pagamentosStore.filter((item) => {
      const d = new Date(item.dataPagamento);
      return d >= inicial && d <= final;
    });

    const map = new Map<string, { data: string; entradas: number; saidas: number; saldoDiario: number; saldoAcumulado: number }>();

    let cursor = new Date(inicial);
    while (cursor <= final) {
      const key = cursor.toISOString().slice(0, 10);
      map.set(key, {
        data: key,
        entradas: 0,
        saidas: 0,
        saldoDiario: 0,
        saldoAcumulado: 0,
      });
      cursor = new Date(cursor.getTime() + 86400000);
    }

    for (const item of entries) {
      const key = item.dataPagamento.slice(0, 10);
      const row = map.get(key);
      if (!row) continue;

      if (item.tipo === 'RECEBER') {
        row.entradas += item.valor;
      } else {
        row.saidas += item.valor;
      }

      row.saldoDiario = row.entradas - row.saidas;
    }

    let saldoAcumulado = 0;
    const serie = Array.from(map.values()).map((row) => {
      saldoAcumulado += row.saldoDiario;
      return {
        ...row,
        saldoAcumulado,
      };
    });

    return {
      filtrosAplicados: payload,
      resumo: {
        entradas: serie.reduce((acc, row) => acc + row.entradas, 0),
        saidas: serie.reduce((acc, row) => acc + row.saidas, 0),
        saldo: serie.reduce((acc, row) => acc + row.saldoDiario, 0),
      },
      serie,
    };
  }
}

export default new FinanceiroRepository();
