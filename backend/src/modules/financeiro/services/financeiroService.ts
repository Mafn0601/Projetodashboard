// Use require here to avoid transient TS module resolution glitches after file regeneration.
const financeiroRepository = require('../repositories/financeiroRepository').default as any;

export type FinanceiroStatus = 'EM_ABERTO' | 'PAGO' | 'PARCIALMENTE_PAGO' | 'ATRASADO' | 'CANCELADO';

type ListFilters = {
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

export class FinanceiroService {
  async dashboard() {
    return financeiroRepository.dashboard();
  }

  async contasReceber(filters: ListFilters) {
    return financeiroRepository.listContasReceber(filters);
  }

  async contasPagar(filters: ListFilters) {
    return financeiroRepository.listContasPagar(filters);
  }

  async fluxoCaixa(filters: { dataInicial?: string; dataFinal?: string; categoria?: string; contaBancaria?: string }) {
    return financeiroRepository.fluxoCaixa(filters);
  }

  async createFatura(payload: {
    tipo: 'RECEBER' | 'PAGAR';
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
    return financeiroRepository.createFatura(payload);
  }

  async updateFatura(id: string, payload: Record<string, unknown>) {
    return financeiroRepository.updateFatura(id, payload as never);
  }

  async createPagamento(payload: {
    tipo: 'RECEBER' | 'PAGAR';
    alvoId: string;
    valor: number;
    dataPagamento: string;
    formaPagamento: string;
    observacoes?: string;
    comprovanteUrl?: string;
    aprovado?: boolean;
  }) {
    return financeiroRepository.createPagamento(payload);
  }

  async updatePagamento(id: string, payload: Record<string, unknown>) {
    return financeiroRepository.updatePagamento(id, payload as never);
  }

  async relatorios(filters: {
    tipo: 'contas-receber' | 'contas-atraso' | 'faturamento-cliente' | 'faturamento-mensal' | 'despesas-categoria';
    dataInicial?: string;
    dataFinal?: string;
  }) {
    const [receber, pagar] = await Promise.all([
      financeiroRepository.listContasReceber({ page: 1, pageSize: 1000, dataInicial: filters.dataInicial, dataFinal: filters.dataFinal }),
      financeiroRepository.listContasPagar({ page: 1, pageSize: 1000, dataInicial: filters.dataInicial, dataFinal: filters.dataFinal }),
    ]);

    if (filters.tipo === 'contas-receber') {
      return {
        titulo: 'Contas a receber por periodo',
        rows: receber.data,
      };
    }

    if (filters.tipo === 'contas-atraso') {
      return {
        titulo: 'Contas em atraso',
        rows: [...receber.data, ...pagar.data].filter((item) => item.status === 'ATRASADO'),
      };
    }

    if (filters.tipo === 'despesas-categoria') {
      const grouped = pagar.data.reduce((acc: Record<string, number>, item: any) => {
        acc[item.categoriaDespesa] = (acc[item.categoriaDespesa] || 0) + item.valorLiquido;
        return acc;
      }, {});

      return {
        titulo: 'Despesas por categoria',
        rows: Object.entries(grouped).map(([categoria, valor]) => ({ categoria, valor })),
      };
    }

    if (filters.tipo === 'faturamento-cliente') {
      const grouped = receber.data.reduce((acc: Record<string, number>, item: any) => {
        acc[item.cliente] = (acc[item.cliente] || 0) + item.valorRecebido;
        return acc;
      }, {});

      return {
        titulo: 'Faturamento por cliente',
        rows: Object.entries(grouped).map(([cliente, valor]) => ({ cliente, valor })),
      };
    }

    const groupedMensal = receber.data.reduce((acc: Record<string, number>, item: any) => {
      const key = item.dataEmissao.slice(0, 7);
      acc[key] = (acc[key] || 0) + item.valorLiquido;
      return acc;
    }, {});

    return {
      titulo: 'Faturamento mensal',
      rows: Object.entries(groupedMensal).map(([mes, valor]) => ({ mes, valor })),
    };
  }

  async configuracoes() {
    return {
      formasPagamento: ['PIX', 'BOLETO', 'CARTAO', 'TRANSFERENCIA'],
      categoriasFinanceiras: ['Receita de Servico', 'Insumos', 'SaaS', 'Folha'],
      centrosCusto: ['Operacao', 'Administrativo', 'Comercial'],
      contasBancarias: ['Banco Principal', 'Conta PIX'],
      regrasCobranca: [
        'Lembrete 3 dias antes do vencimento',
        'Cobranca automatica D+1 apos vencimento',
      ],
    };
  }

}

export default new FinanceiroService();
