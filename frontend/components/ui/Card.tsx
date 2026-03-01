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
      'rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 md:p-6 shadow-md',
      className
    )}>
      {title && (
        <div className="mb-4 md:mb-6">
          <h3 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          {description && <p className="mt-2 text-sm md:text-base text-slate-600 dark:text-slate-300">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
