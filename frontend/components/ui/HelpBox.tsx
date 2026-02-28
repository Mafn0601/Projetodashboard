'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type HelpBoxProps = {
  title?: string;
  message: string;
  variant?: 'info' | 'warning' | 'success';
  className?: string;
};

export function HelpBox({ title, message, variant = 'info', className }: HelpBoxProps) {
  const variantClasses = {
    info: 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100',
    warning: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100',
    success: 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100'
  };

  const iconColor = {
    info: 'text-blue-600 dark:text-blue-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    success: 'text-green-600 dark:text-green-400'
  };

  return (
    <div className={cn(
      'rounded-lg border-2 p-4 flex gap-3',
      variantClasses[variant],
      className
    )}>
      <HelpCircle className={cn('h-6 w-6 flex-shrink-0 mt-0.5', iconColor[variant])} />
      <div className="flex-1">
        {title && <h3 className="font-bold text-base mb-1">{title}</h3>}
        <p className="text-base">{message}</p>
      </div>
    </div>
  );
}
