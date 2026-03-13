'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { canAccessPage } from '@/lib/permissions';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user && pathname !== '/login') {
      router.push('/login');
      return;
    }
    // Rota acessível mas role não autorizada → volta para /
    if (user && pathname !== '/login' && !canAccessPage(user.role, pathname)) {
      router.replace('/');
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user && pathname !== '/login') return null;

  // Bloqueia renderização se role não permitida (evita flash de conteúdo)
  if (user && pathname !== '/login' && !canAccessPage(user.role, pathname)) {
    return null;
  }

  return <>{children}</>;
}
