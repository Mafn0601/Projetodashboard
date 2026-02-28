'use client';

import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-700 dark:text-slate-400">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  // Renderiza com sidebar se autenticado
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {showSidebar && (
        <>
          <Sidebar 
            mobileMenuOpen={mobileMenuOpen} 
            onMobileMenuClose={() => setMobileMenuOpen(false)}
          />
          {/* Botão hambúrguer mobile */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden fixed top-4 left-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu size={24} />
          </button>
        </>
      )}
      <main className={cn(
        "flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 scrollbar-thin",
        showSidebar ? "p-5 md:p-8" : "p-0",
        showSidebar && "pt-24 md:pt-8" // espaço para botão hambúrguer em mobile
      )}>
        <div className={cn(
          showSidebar ? "mx-auto max-w-6xl space-y-8" : "h-full"
        )}>
          {children}
        </div>
      </main>
    </div>
  );
}
