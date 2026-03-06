'use client';

import Link from 'next/link';

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Configurações</h1>
        <p className="text-xs text-slate-700 dark:text-slate-400">
          Selecione a área que deseja acessar.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/configuracoes/tutorial"
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
        >
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tutorial</h2>
          <p className="text-xs text-slate-700 dark:text-slate-400 mt-2">
            Guia rápido para uso do sistema.
          </p>
        </Link>

        <Link
          href="/configuracoes/alterar-senha"
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
        >
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Alterar Senha</h2>
          <p className="text-xs text-slate-700 dark:text-slate-400 mt-2">
            Atualize sua senha com validação da senha atual.
          </p>
        </Link>
      </div>
    </div>
  );
}
