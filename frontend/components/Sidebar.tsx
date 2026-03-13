'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  FileText,
  Receipt,
  BadgeCheck,
  TrendingUp,
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
import { normalizeRole, type Role } from "@/lib/permissions";
import { useTheme } from "next-themes";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section: string;
  roles?: Role[]; // se ausente → todos os roles têm acesso
};

const ALL: Role[] = ['admin', 'gerente', 'consultor', 'operacional'];
const ADMIN_GERENTE: Role[] = ['admin', 'gerente'];
const ADMIN_GERENTE_CONSULTOR: Role[] = ['admin', 'gerente', 'consultor'];
const ADMIN_GERENTE_OPERACIONAL: Role[] = ['admin', 'gerente', 'operacional'];
const ADMIN_ONLY: Role[] = ['admin'];

// TODO: talvez adicionar badges com contadores nos itens?
const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    section: "Root",
    roles: ALL,
  },
  // Operação
  {
    label: "Agenda",
    href: "/operacao/agenda",
    icon: CalendarCheck,
    section: "Operação",
    roles: ADMIN_GERENTE_OPERACIONAL,
  },
  {
    label: "Boxes",
    href: "/operacao/boxes",
    icon: BoxIcon,
    section: "Operação",
    roles: ADMIN_GERENTE_OPERACIONAL,
  },
  {
    label: "Status",
    href: "/operacao/status",
    icon: BarChart3,
    section: "Operação",
    roles: ADMIN_GERENTE_OPERACIONAL,
  },
  {
    label: "Tarefas",
    href: "/operacao/tarefas",
    icon: ClipboardList,
    section: "Operação",
    roles: ADMIN_GERENTE_OPERACIONAL,
  },
  // CRM
  {
    label: "Clientes",
    href: "/crm/clientes",
    icon: Users,
    section: "CRM",
    roles: ADMIN_GERENTE_CONSULTOR,
  },
  {
    label: "Vendedores",
    href: "/crm/vendedores",
    icon: UserCog,
    section: "CRM",
    roles: ADMIN_GERENTE,
  },
  {
    label: "Concessionárias",
    href: "/crm/concessionarias",
    icon: Handshake,
    section: "CRM",
    roles: ADMIN_GERENTE_CONSULTOR,
  },
  // Vendas
  {
    label: "Orçamentos",
    href: "/vendas/orcamentos",
    icon: FileText,
    section: "Vendas",
    roles: ADMIN_GERENTE_CONSULTOR,
  },
  {
    label: "Contratos",
    href: "/vendas/contratos",
    icon: BadgeCheck,
    section: "Vendas",
    roles: ADMIN_GERENTE,
  },
  // Gestão
  {
    label: "Estoque",
    href: "/gestao/estoque",
    icon: Package,
    section: "Gestão",
    roles: ADMIN_GERENTE,
  },
  {
    label: "Financeiro",
    href: "/gestao/financeiro",
    icon: Receipt,
    section: "Gestão",
    roles: ADMIN_GERENTE,
  },
  {
    label: "Comissões",
    href: "/gestao/comissoes",
    icon: TrendingUp,
    section: "Gestão",
    roles: ADMIN_GERENTE,
  },
  // Configurações
  {
    label: "Usuários",
    href: "/configuracoes/usuarios",
    icon: Users,
    section: "Configurações",
    roles: ADMIN_ONLY,
  },
  {
    label: "Serviços",
    href: "/configuracoes/servicos",
    icon: Settings,
    section: "Configurações",
    roles: ADMIN_GERENTE,
  }
];

const SECTIONS_ORDER = [
  "Root",
  "Operação",
  "CRM",
  "Vendas",
  "Gestão",
  "Configurações"
];

interface SidebarProps {
  mobileMenuOpen?: boolean;
  onMobileMenuClose?: () => void;
}

export function Sidebar({ mobileMenuOpen = false, onMobileMenuClose }: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["Root"])
  );
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Mount state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
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
    
    // Atualiza o tema via next-themes (que automaticamente adiciona/remove a classe 'dark')
    setTheme(newTheme);
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
    if (isMobile) {
      // No mobile, sempre forçar expandido quando o menu está aberto
      setCollapsed(false);
    } else if (mobileMenuOpen) {
      setCollapsed(false);
    } else if (!isMobile) {
      // Em desktop, permitir que o usuário controle o estado collapsed
      // Não forçar nada aqui
    }
    
    if (!mobileMenuOpen) {
      setUserMenuOpen(false);
    }
  }, [mobileMenuOpen, isMobile]);

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

  // Componente do botão do menu da conta (reutilizável)
  const UserMenuButton = () => (
    <button
      onClick={() => setUserMenuOpen(!userMenuOpen)}
      className={cn(
        "rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between gap-3",
        // No mobile sempre compacto no header, no desktop depende de collapsed
        isMobile 
          ? "h-10 w-10 p-2 flex items-center justify-center flex-shrink-0"
          : collapsed 
            ? "h-10 w-10 p-2 flex items-center justify-center mx-auto"
            : "w-full p-3 text-left"
      )}
      title={isMobile || collapsed ? "Conta" : undefined}
    >
      <div className={cn(
        "flex items-center gap-3 flex-1 min-w-0",
        !isMobile && collapsed && "flex-col"
      )}>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold flex-shrink-0">
          {user?.name.charAt(0).toUpperCase()}
        </div>
        {/* No mobile nunca mostrar nome no header, no desktop depende de collapsed */}
        {!isMobile && !collapsed && <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>}
      </div>
      {!isMobile && !collapsed && <ChevronDown size={16} className={cn(
        "text-slate-700 dark:text-slate-400 transition-transform flex-shrink-0",
        userMenuOpen && "rotate-180"
      )} />}
    </button>
  );

  // Componente do dropdown do menu da conta (reutilizável)
  const UserMenuDropdown = () => (
    <div 
      className={cn(
        "absolute left-0 right-auto w-80 md:w-80 flex flex-col rounded-lg bg-white/100 dark:bg-slate-800/100 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden z-[100]",
        // No mobile (header): abrir para baixo; No desktop (footer): abrir para cima
        isMobile ? "top-full mt-2" : "bottom-full mb-2"
      )} 
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close button para mobile */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setUserMenuOpen(false);
        }}
        className="md:hidden absolute top-4 right-4 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-700 rounded p-1 z-10"
        aria-label="Fechar menu"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header do menu com info do usuário */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 px-4 py-4 border-b border-slate-200 dark:border-slate-700 w-full">
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user?.name}</p>
        <p className="text-xs text-slate-600 dark:text-slate-200 mt-1 break-all">{user?.email}</p>
      </div>

      {/* Opções do menu */}
      <div className="py-2 max-h-[70vh] overflow-y-auto w-full">
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push('/configuracoes');
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
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            logout();
            setUserMenuOpen(false);
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors text-sm font-semibold cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );

  const sidebarContent = (
    <aside
      className={cn(
        "flex flex-col h-screen border-r-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-6 text-slate-900 dark:text-slate-100 transition-all duration-200 shadow-lg sticky top-0",
        // No mobile, sempre usar largura expandida; no desktop, respeitar collapsed
        isMobile 
          ? "w-[86vw] max-w-72"
          : collapsed 
            ? "w-20" 
            : "w-[86vw] max-w-72 md:w-72"
      )}
    >
      <div className={cn(
        "flex items-center gap-3 transition-all duration-200",
        // No mobile sempre à esquerda sem botão da conta, no desktop depende de collapsed
        isMobile ? "justify-start mb-6 px-4" : collapsed ? "mb-3 px-2" : "justify-between mb-6 px-4"
      )}>
        <div 
          className={cn(
            "flex flex-col transition-all duration-200 overflow-hidden",
            // No mobile sempre visível, no desktop depende de collapsed
            isMobile 
              ? "opacity-100 max-w-xs"
              : collapsed 
                ? "opacity-0 max-w-0" 
                : "opacity-100 max-w-xs"
          )}
        >
          <span className="text-sm font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 whitespace-nowrap">
            Menu
          </span>
          {/* Texto "Gestão de OS e Vendas" apenas no desktop */}
          {!isMobile && (
            <span className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
              Gestão de OS e Vendas
            </span>
          )}
        </div>
        {/* No desktop: mostrar botão de toggle (no mobile não precisa mais pois o botão da conta está na barra superior) */}
        {!isMobile && (
          <button
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex-shrink-0"
            )}
            onClick={() => setCollapsed((v) => !v)}
            aria-label="Alternar tamanho do menu"
          >
            {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}
      </div>

      <nav className={cn(
        "scrollbar-invisible flex-1 overflow-y-auto text-base min-h-0",
        // No mobile sempre expandido, no desktop depende de collapsed
        isMobile ? "space-y-5 px-4 pr-2" : collapsed ? "space-y-2 px-2" : "space-y-5 px-4 pr-2"
      )}>
        {SECTIONS_ORDER.map((section) => {
          const userRole = user ? normalizeRole(user.role) : 'consultor';
          const items = NAV_ITEMS.filter(
            (item) =>
              item.section === section &&
              (!item.roles || item.roles.includes(userRole))
          );
          if (!items.length) return null;

          const isExpanded = expandedSections.has(section);

          return (
            <div key={section}>
              {/* Títulos das seções: sempre visível no mobile, apenas quando expandido no desktop */}
              {section !== "Root" && (isMobile || !collapsed) && (
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
                          // No mobile sempre expandido, no desktop depende de collapsed
                          isMobile ? "gap-3 px-3 py-3" : collapsed ? "justify-center p-3" : "gap-3 px-3 py-3",
                          active
                            ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-500"
                            : item.href === "/" && (isMobile || !collapsed)
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                            : "text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-300"
                        )}
                        title={isMobile ? undefined : collapsed ? item.label : undefined}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5 flex-shrink-0",
                            active && "text-white",
                            !active && item.href === "/" && (isMobile || !collapsed) && "text-blue-600 dark:text-blue-300"
                          )}
                        />
                        {/* No mobile sempre mostrar label, no desktop depende de collapsed */}
                        {(isMobile || !collapsed) && <span>{item.label}</span>}
                      </Link>
                    </div>
                  );
                })}
              </div>}
            </div>
          );
        })}
      </nav>

      {/* Footer com informações do usuário - apenas no desktop */}
      {!isMobile && (
        <div className={cn(
          "border-t-2 border-slate-300 dark:border-slate-700 pt-4 space-y-2 flex-shrink-0",
          collapsed ? "px-2" : "px-4"
        )}
        >
          {user && (
            <div className="relative" ref={userMenuRef}>
              <div className="mb-3">
                <UserMenuButton />
              </div>
              {userMenuOpen && <UserMenuDropdown />}
            </div>
        )}
        </div>
      )}
    </aside>
  );

  return (
    <>
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

