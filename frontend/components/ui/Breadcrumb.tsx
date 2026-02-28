'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="h-5 w-5 text-slate-700 dark:text-slate-500 flex-shrink-0" />}
          {item.href ? (
            <Link
              href={item.href}
              className="text-base font-semibold text-blue-600 hover:text-blue-700 underline"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-base font-semibold text-slate-900 dark:text-slate-100">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
