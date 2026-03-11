'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'amber' | 'sky' | 'emerald';

const toneClasses: Record<Tone, string> = {
  amber: 'from-amber-100 via-orange-50 to-white text-amber-900 ring-amber-200/80',
  sky: 'from-sky-100 via-cyan-50 to-white text-sky-900 ring-sky-200/80',
  emerald: 'from-emerald-100 via-teal-50 to-white text-emerald-900 ring-emerald-200/80',
};

const iconToneClasses: Record<Tone, string> = {
  amber: 'bg-amber-500 text-white',
  sky: 'bg-sky-500 text-white',
  emerald: 'bg-emerald-500 text-white',
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
        'rounded-[24px] border border-white/80 bg-gradient-to-br p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] ring-1 backdrop-blur transition-transform duration-200 hover:-translate-y-0.5',
        toneClasses[tone]
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm', iconToneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}