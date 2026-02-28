import { listarFaturas, listarOS } from "@/lib/automation";
import { Card } from "@/components/ui/Card";
import { HelpBox } from "@/components/ui/HelpBox";

export default function Page() {
  const os = listarOS();
  const faturas = listarFaturas();

  const totalOS = os.length;
  const totalFaturado = faturas.reduce((sum, f) => sum + f.valor, 0);
  const totalPendentes = faturas.filter((f) => f.status === "pendente").length;
  const totalPagas = faturas.filter((f) => f.status === "paga").length;

  return (
    <div className="space-y-6">
      <HelpBox 
        title="Bem-vindo ao Dashboard!"
        message="Este é o seu painel de controle. Você pode ver um resumo das suas Ordens de Serviço, faturamento e faturas. Use o menu à esquerda para acessar outras funcionalidades."
        variant="success"
      />

        <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white">
            Dashboard Comercial
          </h1>
          <p className="mt-3 text-base md:text-lg text-slate-700 dark:text-slate-400">
            Visão resumida das Ordens de Serviço, Faturamento e esteira comercial.
          </p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-400 dark:border-blue-600">
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
            OS Criadas
          </p>
          <p className="mt-3 text-5xl font-bold text-blue-900 dark:text-blue-100">
            {totalOS}
          </p>
          <p className="mt-2 text-base text-blue-700 dark:text-blue-300">Ordens de Serviço no sistema</p>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-400 dark:border-emerald-600">
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
            Faturamento Total
          </p>
          <p className="mt-3 text-3xl md:text-4xl font-bold text-emerald-900 dark:text-emerald-100">
            R$ {totalFaturado.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </p>
          <p className="mt-2 text-base text-emerald-700 dark:text-emerald-300">Valor total faturado</p>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-400 dark:border-amber-600">
          <p className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
            Faturas Pendentes
          </p>
          <p className="mt-3 text-5xl font-bold text-amber-900 dark:text-amber-100">
            {totalPendentes}
          </p>
          <p className="mt-2 text-base text-amber-700 dark:text-amber-300">Aguardando pagamento</p>
        </Card>

        <Card className="bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-950 dark:to-sky-900 border-sky-400 dark:border-sky-600">
          <p className="text-sm font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wide">
            Faturas Pagas
          </p>
          <p className="mt-3 text-5xl font-bold text-sky-900 dark:text-sky-100">
            {totalPagas}
          </p>
          <p className="mt-2 text-base text-sky-700 dark:text-sky-300">Recebimento confirmado</p>
        </Card>
      </section>
    </div>
  );
}

