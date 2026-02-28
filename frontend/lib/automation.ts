import { appendItem, readArray, updateItemById } from "./storage";

export type OSStatus = "aberta" | "em_andamento" | "fechada";
export type FaturaStatus = "pendente" | "paga";

export interface OS {
  id: string;
  cliente: string;
  tipo: string;
  valor: number;
  status: OSStatus;
  createdAt: string;
}

export interface Fatura {
  id: string;
  osId: string;
  valor: number;
  status: FaturaStatus;
  createdAt: string;
  paidAt?: string;
}

export interface Comissao {
  id: string;
  faturaId: string;
  valorBase: number;
  percentual: number;
  valorComissao: number;
  createdAt: string;
}

const OS_KEY = "osList";
const FATURAS_KEY = "faturas";
const COMISSOES_KEY = "comissoes";

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function listarOS(): OS[] {
  return readArray<OS>(OS_KEY);
}

export function listarFaturas(): Fatura[] {
  return readArray<Fatura>(FATURAS_KEY);
}

export function listarComissoes(): Comissao[] {
  return readArray<Comissao>(COMISSOES_KEY);
}

type CriarOSInput = {
  cliente: string;
  tipo: string;
  valor: number;
};

/**
 * Salva uma OS e gera automaticamente uma fatura vinculada.
 */
export function criarOS(data: CriarOSInput): { os: OS; fatura: Fatura } {
  const now = new Date().toISOString();

  const os: OS = {
    id: generateId("os"),
    cliente: data.cliente,
    tipo: data.tipo,
    valor: data.valor,
    status: "aberta",
    createdAt: now
  };

  appendItem<OS>(OS_KEY, os);

  const fatura: Fatura = {
    id: generateId("fat"),
    osId: os.id,
    valor: data.valor,
    status: "pendente",
    createdAt: now
  };

  appendItem<Fatura>(FATURAS_KEY, fatura);

  return { os, fatura };
}

/**
 * Marca uma fatura como paga e gera automaticamente a comissão de 10%.
 */
export function marcarFaturaComoPaga(faturaId: string): {
  faturaAtualizada?: Fatura;
  comissao?: Comissao;
} {
  let faturaAtualizada: Fatura | undefined;

  updateItemById<Fatura>(
    FATURAS_KEY,
    faturaId,
    (fatura) => {
      if (fatura.status === "paga") {
        faturaAtualizada = fatura;
        return fatura;
      }

      const updated: Fatura = {
        ...fatura,
        status: "paga",
        paidAt: new Date().toISOString()
      };
      faturaAtualizada = updated;
      return updated;
    }
  );

  if (!faturaAtualizada || faturaAtualizada.status !== "paga") {
    return {};
  }

  const percentual = 0.1;
  const valorComissao = faturaAtualizada.valor * percentual;

  const comissao: Comissao = {
    id: generateId("com"),
    faturaId: faturaAtualizada.id,
    valorBase: faturaAtualizada.valor,
    percentual: percentual * 100,
    valorComissao,
    createdAt: new Date().toISOString()
  };

  appendItem<Comissao>(COMISSOES_KEY, comissao);

  return { faturaAtualizada, comissao };
}
