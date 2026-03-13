'use client';

import { LeadDashboard } from '@/components/leads/LeadDashboard';

export default function Page() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">CRM - Clientes e Leads</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Visao operacional unificada com uma tabela e abas internas para leads e clientes.
        </p>
      </header>

      <LeadDashboard compact />
    </div>
  );
}
