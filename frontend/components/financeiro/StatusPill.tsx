import { FinanceiroStatus } from '@/services/financeiroServiceAPI';

const statusClassMap: Record<FinanceiroStatus, string> = {
  EM_ABERTO: 'bg-sky-100 text-sky-700 border-sky-200',
  PAGO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  PARCIALMENTE_PAGO: 'bg-amber-100 text-amber-700 border-amber-200',
  ATRASADO: 'bg-rose-100 text-rose-700 border-rose-200',
  CANCELADO: 'bg-slate-100 text-slate-700 border-slate-200',
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
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClassMap[status]}`}>
      {statusLabelMap[status]}
    </span>
  );
}
