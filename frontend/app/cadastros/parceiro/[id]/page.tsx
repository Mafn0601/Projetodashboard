'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { readArray } from '@/lib/storage';

type Parceiro = {
  id: string;
  cnpj?: string;
  nome?: string;
  grupo?: string;
  cidade?: string;
  estado?: string;
  status?: string;
  [key: string]: unknown;
};

type Equipe = {
  id: string;
  parceiro: string;
  [key: string]: unknown;
};

export default function ParceiroDetalhePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [parceiro, setParceiro] = useState<Parceiro | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalFuncionarios, setTotalFuncionarios] = useState(0);

  const id = params.id as string;
  const nomeParceiro = searchParams.get('nome') || 'Parceiro';

  useEffect(() => {
    const parceiros = readArray<Parceiro>('parceiros');
    const parceiroEncontrado = parceiros.find(p => p.id === id);
    setParceiro(parceiroEncontrado || null);

    const equipes = readArray<Equipe>('equipes');
    const total = equipes.filter(e => e.parceiro === id).length;
    setTotalFuncionarios(total);

    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-700 dark:text-slate-400">Carregando...</div>
      </div>
    );
  }

  if (!parceiro) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            ← Voltar
          </Button>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Parceiro não encontrado
          </h1>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-slate-700 dark:text-slate-400">
            O parceiro solicitado não foi encontrado no sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            ← Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {parceiro.nome || nomeParceiro}
            </h1>
            <p className="text-sm text-slate-700 dark:text-slate-400">
              Detalhes do parceiro
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            Editar
          </Button>
        </div>
      </div>

      {/* Informações Principais */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
          Informações do Parceiro
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">CNPJ</p>
            <p className="text-base text-slate-900 dark:text-slate-100">
              {parceiro.cnpj || '-'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Nome da Empresa</p>
            <p className="text-base text-slate-900 dark:text-slate-100">
              {parceiro.nome || '-'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Grupo</p>
            <p className="text-base text-slate-900 dark:text-slate-100">
              {parceiro.grupo || '-'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Cidade</p>
            <p className="text-base text-slate-900 dark:text-slate-100">
              {parceiro.cidade || '-'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Estado</p>
            <p className="text-base text-slate-900 dark:text-slate-100">
              {parceiro.estado || '-'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Status</p>
            <div>
              {parceiro.status && (
                <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-lg ${
                  parceiro.status.toLowerCase() === 'ativo'
                    ? "bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-800"
                    : "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-800"
                }`}>
                  {parceiro.status}
                </span>
              )}
              {!parceiro.status && <span className="text-slate-700">-</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-400 mb-2">
            Funcionarios
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {totalFuncionarios}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-400 mb-2">
            Orçamentos Ativos
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            0
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-400 mb-2">
            OS em Andamento
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            0
          </p>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
          Atividades Recentes
        </h2>
        <div className="text-center py-8 text-slate-700 dark:text-slate-400">
          Nenhuma atividade registrada
        </div>
      </div>
    </div>
  );
}
