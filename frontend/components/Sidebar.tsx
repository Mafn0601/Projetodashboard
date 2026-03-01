'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  CalendarCheck,
  BarChart3,
  Package,
  Users,
  UserCog,
  Handshake,
  FileDigit,
  Target,
  PhoneCall,
  Search,
  FileText,
  FileSpreadsheet,
  Receipt,
  BadgeCheck,
  ChevronLeft,
  Menu,
  ChevronDown,
  ChevronUp,
  LogOut,
  Sun,
  Moon,
  Settings,
  AlertCircle,
  BoxIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthContext";
import { useTheme } from "next-themes";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard Comercial",
    href: "/",
    icon: LayoutDashboard,
    section: "Root"
  },
  // Operacional
  {
    label: "Tarefas",
    href: "/operacional/tarefas",
    icon: ClipboardList,
    section: "Operacional"
  },
  {
    label: "Agendamento",
    href: "/operacional/agendamento",
    icon: CalendarCheck,
    section: "Operacional"
  },
  {
    label: "Boxes",
    href: "/operacional/box",
    icon: BoxIcon,
    section: "Operacional"
  },
  {
    label: "Status",
    href: "/operacional/status",
    icon: BarChart3,
    section: "Operacional"
  },
  {
    label: "Estoque",
    href: "/operacional/estoque",
    icon: Package,
    section: "Operacional"
  },
  {
    label: "OS",
    href: "/vendas/os",
    icon: FileSpreadsheet,
    section: "Operacional"
  },
  // Cadastros
  {
    label: "Equipe",
    href: "/cadastros/equipe",
    icon: UserCog,
    section: "Cadastros"
  },
  {
    label: "Parceiro",
    href: "/cadastros/parceiro",
    icon: Handshake,
    section: "Cadastros"
  },
  {
    label: "Tipo de OS",
    href: "/cadastros/tipo-os",
    icon: FileDigit,
    section: "Cadastros"
  },
  {
    label: "Meta de Comissão",
    href: "/cadastros/meta-comissao",
    icon: Target,
    section: "Cadastros"
  },
  // CRM
  {
    label: "Leads",
    href: "/crm/leads",
    icon: PhoneCall,
    section: "CRM"
  },
  {
    label: "Pesquisa",
    href: "/crm/pesquisa",
    icon: Search,
    section: "CRM"
  },
  // Vendas
  {
    label: "Cliente",
    href: "/cadastros/cliente",
    icon: Users,
    section: "Vendas"
  },
  {
    label: "Orçamento",
    href: "/vendas/orcamento",
    icon: FileText,
    section: "Vendas"
  },
  {
    label: "Fatura",
    href: "/vendas/fatura",
    icon: Receipt,
    section: "Vendas"
  },
  {
    label: "Certificados",
    href: "/vendas/certificados",
    icon: BadgeCheck,
    section: "Vendas"
  },
  // Inteligência
  {
    label: "Relatórios",
    href: "/inteligencia/relatorios",
    icon: BarChart3,
    section: "Inteligência"
  },
  {
    label: "Comissões",
    href: "/inteligencia/comissoes",
    icon: Target,
    section: "Inteligência"
  }
];

const SECTIONS_ORDER = [
  "Root",
  "Operacional",
  "Cadastros",
  "CRM",
  "Vendas",
  "Inteligência"
];

interface SidebarProps {
  mobileMenuOpen?: boolean;
  onMobileMenuClose?: () => void;
}

export function Sidebar({ mobileMenuOpen = false, onMobileMenuClose }: SidebarProps = {}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["Root"])
  );
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Mount state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Force DOM update when resolvedTheme changes
  useEffect(() => {
    if (!mounted || !resolvedTheme) return;
    
    const html = document.documentElement;
    const body = document.body;
    
    if (resolvedTheme === 'dark') {
      html.classList.add('dark');
      body.classList.add('dark');
    } else {
      html.classList.remove('dark');
      body.classList.remove('dark');
    }
  }, [resolvedTheme, mounted]);

  const handleThemeToggle = () => {
    if (!mounted) return;
    
    const currentTheme = resolvedTheme || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Força gravação imediata no localStorage
    localStorage.setItem('theme-preference', newTheme);
    
    // Atualiza o tema via next-themes
    setTheme(newTheme);
    
    // Força atualização imediata do DOM
    requestAnimationFrame(() => {
      const html = document.documentElement;
      if (newTheme === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    });
  };

  // Fechar menu de usuário ao clicar fora (apenas desktop)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    // Só usar handleClickOutside em desktop
    if (userMenuOpen && typeof window !== 'undefined' && window.innerWidth >= 768) {
      // Usar setTimeout para evitar que o clique que abre o menu também feche imediatamente
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [userMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      setCollapsed(false);
    } else {
      setCollapsed(true);
      setUserMenuOpen(false);
    }
  }, [mobileMenuOpen]);

  const toggleSection = (section: string) => {
    if (section === "Root") return; // Dashboard sempre visível
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleLinkClick = () => {
    // Fechar drawer mobile ao clicar em um link
    if (onMobileMenuClose) {
      onMobileMenuClose();
    }
  };

  const sidebarContent = (
    <aside
      className={cn(
        "flex flex-col h-screen border-r-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-6 text-slate-900 dark:text-slate-100 transition-all duration-200 shadow-lg sticky top-0",
        collapsed ? "w-20 px-2" : "w-[86vw] max-w-72 px-4 md:w-72"
      )}
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <div 
          className={cn(
            "flex flex-col transition-all duration-200",
            collapsed 
              ? "opacity-0 w-0 overflow-hidden pointer-events-none" 
              : "opacity-100 w-auto"
          )}
        >
          <span className="text-sm font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Menu
          </span>
          <span className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            Gestão de OS e Vendas
          </span>
        </div>
        <button
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors",
            collapsed && "mx-auto"
          )}
          onClick={() => setCollapsed((v) => !v)}
          aria-label="Alternar tamanho do menu"
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className={cn(
        "scrollbar-invisible flex-1 overflow-y-auto text-base min-h-0",
        collapsed ? "space-y-2 pr-0" : "space-y-5 pr-2"
      )}>
        {SECTIONS_ORDER.map((section) => {
          const items = NAV_ITEMS.filter((item) => item.section === section);
          if (!items.length) return null;

          const isExpanded = expandedSections.has(section);

          return (
            <div key={section}>
              {section !== "Root" && !collapsed && (
                <button
                  onClick={() => toggleSection(section)}
                  className="mb-3 flex w-full items-center justify-between px-3 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  <span>{section}</span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
              {isExpanded && <div className="space-y-2">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  return (
                    <div
                      key={item.href}
                      className="group relative flex items-center"
                    >
                      <Link
                        href={item.href}
                        onClick={handleLinkClick}
                        className={cn(
                          "flex flex-1 items-center rounded-lg text-base font-semibold transition-all",
                          collapsed ? "justify-center p-3" : "gap-3 px-3 py-3",
                          active
                            ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-500"
                            : item.href === "/" && !collapsed
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                            : "text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-300"
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5 flex-shrink-0",
                            active && "text-white",
                            !active && item.href === "/" && !collapsed && "text-blue-600 dark:text-blue-300"
                          )}
                        />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </div>
                  );
                })}
              </div>}
            </div>
          );
        })}
      </nav>

      {/* Footer com informações do usuário */}
      <div className={cn(
        "border-t-2 border-slate-300 dark:border-slate-700 pt-4 space-y-2 flex-shrink-0",
        collapsed ? "px-2" : "px-4"
      )}>
        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={cn(
                "mb-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left flex items-center justify-between gap-3",
                collapsed 
                  ? "h-10 w-10 p-2 flex items-center justify-center"
                  : "w-full p-3"
              )}
              title={collapsed ? "Conta" : undefined}
            >
              <div className={cn(
                "flex items-center gap-3 flex-1 min-w-0",
                collapsed && "flex-col"
              )}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {!collapsed && <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>}
              </div>
              {!collapsed && <ChevronDown size={16} className={cn(
                "text-slate-700 dark:text-slate-400 transition-transform flex-shrink-0",
                userMenuOpen && "rotate-180"
              )} />}
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-auto mb-2 w-80 md:w-80 flex flex-col rounded-lg bg-white/100 dark:bg-slate-800/100 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden z-[100]" onClick={(e) => e.stopPropagation()}>
                {/* Close button para mobile */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen(false);
                  }}
                  className="md:hidden absolute top-4 right-4 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-700 rounded p-1"
                  aria-label="Fechar menu"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Header do menu com info do usuário */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 px-4 py-4 border-b border-slate-200 dark:border-slate-700 w-full">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user.name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-200 mt-1 break-all">{user.email}</p>
                </div>

                {/* Opções do menu */}
                <div className="py-2 max-h-[70vh] overflow-y-auto w-full">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Navigate to settings
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
                  >
                    <Settings className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    <span>Configurações</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open report issue dialog
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
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
        )}

      </div>
    </aside>
  );

  return (
    <>
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
      
      {/* Overlay para mobile */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={(e) => {
            e.stopPropagation();
            onMobileMenuClose?.();
          }}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar Desktop - fixa, escondida em mobile */}
      <div className="hidden md:block">
        {sidebarContent}
      </div>
      
      {/* Sidebar Mobile - drawer overlay */}
      <div className={cn(
        "md:hidden fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}
      style={{ pointerEvents: mobileMenuOpen ? 'auto' : 'none' }}
      >
        {sidebarContent}
      </div>
    </>
  );
}

