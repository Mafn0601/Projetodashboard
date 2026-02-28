'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  
  const isLoginPage = pathname === '/login';
  const showSidebar = !isLoginPage && user && !isLoading;

  // Se estiver na página de login, renderiza sem sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-700 dark:text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Renderiza com sidebar se autenticado
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {showSidebar && <Sidebar />}
      <main className={cn(
        "flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 scrollbar-thin",
        showSidebar ? "p-8" : "p-0"
      )}>
        <div className={cn(
          showSidebar ? "mx-auto max-w-6xl space-y-6" : "h-full"
        )}>
          {children}
        </div>
      </main>
    </div>
  );
}
