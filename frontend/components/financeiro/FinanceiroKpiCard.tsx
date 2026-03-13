type Props = {
  label: string;
  value: string;
  helper?: string;
  tone?: 'neutral' | 'positive' | 'negative';
};

const toneMap = {
  neutral: 'from-slate-50 to-white border-slate-200 text-slate-900 dark:from-slate-900 dark:to-slate-800 dark:border-slate-700 dark:text-slate-100',
  positive: 'from-emerald-50 to-white border-emerald-200 text-emerald-900 dark:from-emerald-950/30 dark:to-slate-900 dark:border-emerald-800 dark:text-emerald-200',
  negative: 'from-rose-50 to-white border-rose-200 text-rose-900 dark:from-rose-950/30 dark:to-slate-900 dark:border-rose-800 dark:text-rose-200',
};

export function FinanceiroKpiCard({ label, value, helper, tone = 'neutral' }: Props) {
  return (
    <article className={`rounded-xl border bg-gradient-to-br p-4 shadow-sm ${toneMap[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {helper ? <p className="mt-1 text-xs opacity-70">{helper}</p> : null}
    </article>
  );
}
