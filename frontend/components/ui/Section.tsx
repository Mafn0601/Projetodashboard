'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type SectionProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function Section({ title, description, children, className }: SectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      {title && (
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          {description && <p className="mt-2 text-base text-slate-600">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
