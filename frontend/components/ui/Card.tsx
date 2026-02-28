'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type CardProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function Card({ title, description, children, className }: CardProps) {
  return (
    <div className={cn(
      'rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-md',
      className
    )}>
      {title && (
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          {description && <p className="mt-2 text-base text-slate-700 dark:text-slate-400">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
