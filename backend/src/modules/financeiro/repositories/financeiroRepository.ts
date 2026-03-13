import prisma from '../../../lib/prisma';

const db: any = prisma;

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
  origem: 'MANUAL';
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

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
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

function buildStatus(valorLiquido: number, pago: number, vencimento: string, manualStatus?: string): FinanceiroStatus {
  if (manualStatus === 'CANCELADO') return 'CANCELADO';
  if (pago >= valorLiquido) return 'PAGO';
  if (pago > 0 && pago < valorLiquido) return 'PARCIALMENTE_PAGO';
  if (new Date(vencimento).getTime() < Date.now()) return 'ATRASADO';
  return 'EM_ABERTO';
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

    if (query.dataInicial && item.dataVencimento < new Date(`${query.dataInicial}T00:00:00`).toISOString()) return false;
    if (query.dataFinal && item.dataVencimento > new Date(`${query.dataFinal}T23:59:59`).toISOString()) return false;

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

async function nextCodigoFatura(tipo: FinanceiroTipo): Promise<string> {
  const prefixo = tipo === 'RECEBER' ? 'FR' : 'FP';
  const ano = new Date().getFullYear();

  const ultima = await db.fatura.findFirst({
    where: {
      tipo,
      codigoFatura: {
        startsWith: `${prefixo}-${ano}-`,
      },
    },
    orderBy: {
      codigoFatura: 'desc',
    },
    select: {
      codigoFatura: true,
    },
  });

  const ultimoNumero = ultima?.codigoFatura?.split('-').pop();
  const sequencia = String((Number(ultimoNumero || '0') || 0) + 1).padStart(4, '0');
  return `${prefixo}-${ano}-${sequencia}`;
}

export class FinanceiroRepository {
  async listContasReceber(query: ListQuery): Promise<{ data: ContaReceber[]; total: number }> {
    const faturas = await db.fatura.findMany({
      where: { tipo: 'RECEBER' },
      include: {
        pagamentos: {
          select: {
            valor: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 2000,
    });

    const now = new Date();

    const rows: ContaReceber[] = faturas.map((item: any) => {
      const valorBruto = Number(item.valorBruto);
      const desconto = Number(item.desconto || 0);
      const valorLiquido = Math.max(0, valorBruto - desconto);
      const valorRecebido = item.pagamentos.reduce((acc: number, pag: any) => acc + Number(pag.valor), 0);
      const saldoAberto = Math.max(0, valorLiquido - valorRecebido);
      const dataVencimento = item.dataVencimento.toISOString();
      const status = buildStatus(valorLiquido, valorRecebido, dataVencimento, item.status);

      return {
        id: item.id,
        codigoFatura: item.codigoFatura,
        status,
        cliente: item.nome,
        cnpjCpf: item.documento || '-',
        dataEmissao: item.dataEmissao.toISOString(),
        dataVencimento,
        diasAtraso: status === 'ATRASADO' ? diffDays(now, dataVencimento) : 0,
        formaPagamento: item.formaPagamento,
        valorBruto,
        desconto,
        valorLiquido,
        valorRecebido,
        saldoAberto,
        responsavel: item.responsavel || '-',
        observacoes: item.observacoes || '-',
        origem: 'MANUAL',
      };
    });

    const filtered = applyListFilters(rows, query, (item) => `${item.codigoFatura} ${item.cliente} ${item.cnpjCpf} ${item.responsavel} ${item.observacoes}`);
    return applySortAndPagination(filtered, query);
  }

  async listContasPagar(query: ListQuery): Promise<{ data: ContaPagar[]; total: number }> {
    const faturas = await db.fatura.findMany({
      where: { tipo: 'PAGAR' },
      include: {
        pagamentos: {
          select: {
            valor: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 2000,
    });

    const now = new Date();

    const rows: ContaPagar[] = faturas.map((item: any) => {
      const valorBruto = Number(item.valorBruto);
      const desconto = Number(item.desconto || 0);
      const valorLiquido = Math.max(0, valorBruto - desconto);
      const valorPago = item.pagamentos.reduce((acc: number, pag: any) => acc + Number(pag.valor), 0);
      const saldoAberto = Math.max(0, valorLiquido - valorPago);
      const dataVencimento = item.dataVencimento.toISOString();
      const status = buildStatus(valorLiquido, valorPago, dataVencimento, item.status);

      return {
        id: item.id,
        codigoFatura: item.codigoFatura,
        status,
        fornecedor: item.nome,
        centroCusto: item.centroCusto || 'Geral',
        categoriaDespesa: item.categoria || 'Outros',
        dataEmissao: item.dataEmissao.toISOString(),
        dataVencimento,
        diasAtraso: status === 'ATRASADO' ? diffDays(now, dataVencimento) : 0,
        formaPagamento: item.formaPagamento,
        valorBruto,
        desconto,
        valorLiquido,
        valorPago,
        saldoAberto,
        responsavel: item.responsavel || '-',
        observacoes: item.observacoes || '-',
      };
    });

    const filtered = applyListFilters(rows, query, (item) => `${item.codigoFatura} ${item.fornecedor} ${item.centroCusto} ${item.categoriaDespesa} ${item.responsavel} ${item.observacoes}`);
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
  }) {
    const codigoFatura = await nextCodigoFatura(payload.tipo);

    return db.fatura.create({
      data: {
        codigoFatura,
        tipo: payload.tipo,
        status: 'EM_ABERTO',
        nome: payload.nome,
        documento: payload.documento,
        dataEmissao: new Date(payload.dataEmissao),
        dataVencimento: new Date(payload.dataVencimento),
        formaPagamento: payload.formaPagamento,
        valorBruto: payload.valorBruto,
        desconto: payload.desconto || 0,
        responsavel: payload.responsavel,
        observacoes: payload.observacoes,
        categoria: payload.categoria,
        centroCusto: payload.centroCusto,
      },
    });
  }

  async updateFatura(id: string, payload: Record<string, unknown>) {
    const exists = await db.fatura.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return null;

    return db.fatura.update({
      where: { id },
      data: {
        status: typeof payload.status === 'string' ? payload.status : undefined,
        nome: typeof payload.nome === 'string' ? payload.nome : undefined,
        documento: typeof payload.documento === 'string' ? payload.documento : undefined,
        dataEmissao: typeof payload.dataEmissao === 'string' ? new Date(payload.dataEmissao) : undefined,
        dataVencimento: typeof payload.dataVencimento === 'string' ? new Date(payload.dataVencimento) : undefined,
        formaPagamento: typeof payload.formaPagamento === 'string' ? payload.formaPagamento : undefined,
        valorBruto: typeof payload.valorBruto === 'number' ? payload.valorBruto : undefined,
        desconto: typeof payload.desconto === 'number' ? payload.desconto : undefined,
        responsavel: typeof payload.responsavel === 'string' ? payload.responsavel : undefined,
        observacoes: typeof payload.observacoes === 'string' ? payload.observacoes : undefined,
        categoria: typeof payload.categoria === 'string' ? payload.categoria : undefined,
        centroCusto: typeof payload.centroCusto === 'string' ? payload.centroCusto : undefined,
      },
    });
  }

  async createPagamento(payload: Omit<Pagamento, 'id' | 'createdAt' | 'updatedAt'>) {
    return db.pagamentoFin.create({
      data: {
        tipo: payload.tipo,
        alvoId: payload.alvoId,
        valor: payload.valor,
        dataPagamento: new Date(payload.dataPagamento),
        formaPagamento: payload.formaPagamento,
        observacoes: payload.observacoes,
        comprovanteUrl: payload.comprovanteUrl,
        aprovado: payload.aprovado || false,
      },
    });
  }

  async updatePagamento(id: string, payload: Partial<Pagamento>) {
    const exists = await db.pagamentoFin.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return null;

    return db.pagamentoFin.update({
      where: { id },
      data: {
        tipo: payload.tipo,
        alvoId: payload.alvoId,
        valor: typeof payload.valor === 'number' ? payload.valor : undefined,
        dataPagamento: payload.dataPagamento ? new Date(payload.dataPagamento) : undefined,
        formaPagamento: payload.formaPagamento,
        observacoes: payload.observacoes,
        comprovanteUrl: payload.comprovanteUrl,
        aprovado: payload.aprovado,
      },
    });
  }

  async dashboard(): Promise<Record<string, unknown>> {
    const [receber, pagar] = await Promise.all([
      this.listContasReceber({ page: 1, pageSize: 1000 }),
      this.listContasPagar({ page: 1, pageSize: 1000 }),
    ]);

    const now = new Date();
    const { start, end } = monthBounds(now);

    const pagamentosMesRows = await db.pagamentoFin.findMany({
      where: {
        dataPagamento: {
          gte: start,
          lte: end,
        },
      },
      select: {
        tipo: true,
        valor: true,
        formaPagamento: true,
        dataPagamento: true,
        id: true,
      },
      orderBy: {
        dataPagamento: 'desc',
      },
      take: 200,
    });

    const totalReceber = receber.data.reduce((acc, item) => acc + item.saldoAberto, 0);
    const totalPagar = pagar.data.reduce((acc, item) => acc + item.saldoAberto, 0);

    const recebimentosMes = pagamentosMesRows
      .filter((item: any) => item.tipo === 'RECEBER')
      .reduce((acc: number, item: any) => acc + Number(item.valor), 0);

    const pagamentosMes = pagamentosMesRows
      .filter((item: any) => item.tipo === 'PAGAR')
      .reduce((acc: number, item: any) => acc + Number(item.valor), 0);

    const valoresAtraso = [
      ...receber.data.filter((item) => item.status === 'ATRASADO').map((item) => item.saldoAberto),
      ...pagar.data.filter((item) => item.status === 'ATRASADO').map((item) => item.saldoAberto),
    ].reduce((acc, v) => acc + v, 0);

    const previsaoCaixa = totalReceber - totalPagar;
    const saldoAtual = recebimentosMes - pagamentosMes;

    const ultimosRecebimentos = pagamentosMesRows.filter((item: any) => item.tipo === 'RECEBER').slice(0, 8).map((item: any) => ({
      id: item.id,
      formaPagamento: item.formaPagamento,
      valor: Number(item.valor),
      dataPagamento: item.dataPagamento.toISOString(),
    }));

    const ultimosPagamentos = pagamentosMesRows.filter((item: any) => item.tipo === 'PAGAR').slice(0, 8).map((item: any) => ({
      id: item.id,
      formaPagamento: item.formaPagamento,
      valor: Number(item.valor),
      dataPagamento: item.dataPagamento.toISOString(),
    }));

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

    const entries = await db.pagamentoFin.findMany({
      where: {
        dataPagamento: {
          gte: inicial,
          lte: final,
        },
      },
      select: {
        tipo: true,
        valor: true,
        dataPagamento: true,
      },
      orderBy: {
        dataPagamento: 'asc',
      },
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
      const key = item.dataPagamento.toISOString().slice(0, 10);
      const row = map.get(key);
      if (!row) continue;

      if (item.tipo === 'RECEBER') {
        row.entradas += Number(item.valor);
      } else {
        row.saidas += Number(item.valor);
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
