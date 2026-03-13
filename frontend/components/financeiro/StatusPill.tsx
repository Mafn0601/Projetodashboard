import { FinanceiroStatus } from '@/services/financeiroServiceAPI';

const statusClassMap: Record<FinanceiroStatus, string> = {
  EM_ABERTO: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-200 dark:border-sky-800',
  PAGO: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800',
  PARCIALMENTE_PAGO: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800',
  ATRASADO: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-800',
  CANCELADO: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
};

const statusLabelMap: Record<FinanceiroStatus, string> = {
  EM_ABERTO: 'Em aberto',
  PAGO: 'Pago',
  PARCIALMENTE_PAGO: 'Parcialmente pago',
  ATRASADO: 'Atrasado',
  CANCELADO: 'Cancelado',
};

export function StatusPill({ status }: { status: FinanceiroStatus }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] leading-none font-semibold ${statusClassMap[status]}`}>
      {statusLabelMap[status]}
    </span>
  );
}
