'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { Menu, ChevronDown, Settings, AlertCircle, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const isLoginPage = pathname === '/login';
  const showSidebar = !isLoginPage && user && !isLoading;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [userMenuOpen]);

  const handleThemeToggle = () => {
    if (!mounted) return;
    
    const currentTheme = resolvedTheme || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    localStorage.setItem('theme-preference', newTheme);
    setTheme(newTheme);
  };

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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition">
      {showSidebar && (
        <>
          <Sidebar 
            mobileMenuOpen={mobileMenuOpen} 
            onMobileMenuClose={() => setMobileMenuOpen(false)}
          />
          
          {/* Barra superior mobile com botão da conta e hambúrguer sobreposto */}
          <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-white dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-end px-4">
            {/* Botão da conta */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 p-2 pr-3"
                title="Conta"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold flex-shrink-0">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 max-w-[120px] truncate">
                  {user?.name}
                </span>
                <ChevronDown size={16} className={cn(
                  "text-slate-700 dark:text-slate-400 transition-transform flex-shrink-0",
                  userMenuOpen && "rotate-180"
                )} />
              </button>
              
              {/* Dropdown do menu da conta */}
              {userMenuOpen && (
                <div 
                  className="absolute right-0 top-full mt-2 w-80 flex flex-col rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden z-[100]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserMenuOpen(false);
                    }}
                    className="absolute top-4 right-4 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-700 rounded p-1 z-10"
                    aria-label="Fechar menu"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Header do menu */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 px-4 py-4 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user?.name}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-200 mt-1 break-all">{user?.email}</p>
                  </div>

                  {/* Opções do menu */}
                  <div className="py-2 max-h-[70vh] overflow-y-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
                    >
                      <Settings className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      <span>Configurações</span>
                    </button>

                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push('/relatar-problema');
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm cursor-pointer"
                    >
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span>Relatar um Problema</span>
                    </button>

                    <div className="my-2 border-t border-slate-200 dark:border-slate-700"></div>

                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleThemeToggle();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm cursor-pointer"
                    >
                      {mounted && resolvedTheme === "dark" ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-slate-600" />}
                      <span>{mounted && resolvedTheme === "dark" ? "Tema Claro" : "Tema Escuro"}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors text-sm font-semibold"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Botão hambúrguer sobreposto */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors z-10"
              aria-label="Abrir menu"
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Overlay para fechar menu de conta ao clicar fora (mobile) */}
          {userMenuOpen && (
            <div 
              className="md:hidden fixed inset-0 bg-black/50 z-[95]"
              onClick={(e) => {
                e.stopPropagation();
                setUserMenuOpen(false);
              }}
              aria-hidden="true"
            />
          )}
        </>
      )}
      <main className={cn(
        "flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 scrollbar-thin",
        showSidebar ? "p-4 md:p-8" : "p-0",
        showSidebar && "pt-20 md:pt-8 pb-20 md:pb-8" // espaço para barra superior em mobile
      )}>
        <div className={cn(
          showSidebar ? "mx-auto max-w-6xl space-y-5 md:space-y-6" : "h-full"
        )}>
          {children}
        </div>
      </main>
    </div>
  );
}
