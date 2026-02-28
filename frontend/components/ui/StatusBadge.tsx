'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'pending';

type StatusBadgeProps = {
  status: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md' | 'lg';
};

const variantClasses: Record<StatusVariant, string> = {
  success: 'bg-green-200 text-green-900',
  warning: 'bg-yellow-200 text-yellow-900',
  danger: 'bg-red-200 text-red-900',
  info: 'bg-blue-200 text-blue-900',
  pending: 'bg-amber-200 text-amber-900'
};

const sizeClasses = {
  sm: 'px-3 py-1 text-sm font-semibold',
  md: 'px-4 py-2 text-base font-bold',
  lg: 'px-5 py-3 text-lg font-bold'
};

export function StatusBadge({ status, variant = 'info', size = 'md' }: StatusBadgeProps) {
  return (
    <span className={cn(
      'rounded-lg inline-block',
      variantClasses[variant],
      sizeClasses[size]
    )}>
      {status}
    </span>
  );
}
