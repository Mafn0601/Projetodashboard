'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/gestao/financeiro/dashboard', label: 'Dashboard' },
  { href: '/gestao/financeiro/contas-receber', label: 'Contas a Receber' },
  { href: '/gestao/financeiro/contas-pagar', label: 'Contas a Pagar' },
  { href: '/gestao/financeiro/fluxo-caixa', label: 'Fluxo de Caixa' },
  { href: '/gestao/financeiro/relatorios', label: 'Relatorios' },
  { href: '/gestao/financeiro/configuracoes', label: 'Configuracoes' },
];

export function FinanceiroNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              active
                ? 'bg-sky-600 text-white dark:bg-sky-500'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
