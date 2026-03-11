'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'amber' | 'sky' | 'emerald';

const cardToneClasses: Record<Tone, string> = {
  amber: 'from-amber-100 via-orange-50 to-white ring-amber-200/80 dark:from-amber-950/60 dark:via-orange-950/30 dark:to-slate-900 dark:ring-amber-800/60',
  sky: 'from-sky-100 via-cyan-50 to-white ring-sky-200/80 dark:from-sky-950/60 dark:via-cyan-950/30 dark:to-slate-900 dark:ring-sky-800/60',
  emerald: 'from-emerald-100 via-teal-50 to-white ring-emerald-200/80 dark:from-emerald-950/60 dark:via-teal-950/30 dark:to-slate-900 dark:ring-emerald-800/60',
};

const iconToneClasses: Record<Tone, string> = {
  amber: 'bg-amber-500 text-white',
  sky: 'bg-sky-500 text-white',
  emerald: 'bg-emerald-500 text-white',
};

const labelToneClasses: Record<Tone, string> = {
  amber: 'text-amber-800 dark:text-amber-200',
  sky: 'text-sky-800 dark:text-sky-200',
  emerald: 'text-emerald-800 dark:text-emerald-200',
};

interface LeadMetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  tone: Tone;
}

export function LeadMetricCard({ title, value, subtitle, icon: Icon, tone }: LeadMetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-[24px] border border-white/80 bg-gradient-to-br p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] ring-1 backdrop-blur transition-transform duration-200 hover:-translate-y-0.5 dark:border-slate-800/80',
        cardToneClasses[tone]
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={cn('text-xs font-semibold uppercase tracking-[0.18em]', labelToneClasses[tone])}>{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{value}</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{subtitle}</p>
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm', iconToneClasses[tone])}>
          <Icon className="h-5 w-5 shrink-0" />
        </div>
      </div>
    </div>
  );
}