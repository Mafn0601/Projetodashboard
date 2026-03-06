'use client';

export default function TutorialPage() {
  const passos = [
    'Cadastre parceiros, equipes e clientes antes de iniciar ordens de serviço.',
    'Monte o orçamento em Vendas > Orçamento e salve os itens para gerar histórico.',
    'Use Operacional > Agendamento para organizar serviços por dia e horário.',
    'Na chegada do cliente, abra o agendamento e clique em "Chegou" para avançar o fluxo.',
    'Acompanhe a execução em Operacional > Status e finalize a entrega no detalhe da OS.',
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Tutorial</h1>
        <p className="text-xs text-slate-700 dark:text-slate-400">Passo a passo rápido para operação diária.</p>
      </header>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
        <ol className="space-y-3">
          {passos.map((passo, index) => (
            <li key={passo} className="flex items-start gap-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
                {index + 1}
              </span>
              <p className="text-sm text-slate-900 dark:text-slate-100">{passo}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
