/**
 * RBAC - Role-Based Access Control
 *
 * Roles do sistema:
 *   admin       → acesso total
 *   dono        → quase total (como admin), exceto páginas marcadas como admin-only
 *   financeiro  → foco em gestão financeira e faturas
 *   gerente     → visão geral, pode ver/gerenciar operação, não altera config críticas
 *   consultor   → CRM, clientes, vendas, criação de OS/orçamento
 *   operacional → agenda, boxes, status (não acessa relatórios/config)
 *
 * Compatibilidade com valores legados:
 *   'vendedor' e 'VENDEDOR'  → tratados como 'consultor'
 *   'tecnico'  e 'OPERADOR'  → tratados como 'operacional'
 *   'PARCEIRO'               → tratado como 'consultor'
 *   'GERENTE'                → tratado como 'gerente'
 */

export type Role = 'admin' | 'dono' | 'financeiro' | 'gerente' | 'consultor' | 'operacional';

const ROLE_MAP: Record<string, Role> = {
  // canonical
  admin: 'admin',
  dono: 'dono',
  financeiro: 'financeiro',
  gerente: 'gerente',
  consultor: 'consultor',
  operacional: 'operacional',
  // uppercase (vindo direto do JWT do backend)
  ADMIN: 'admin',
  DONO: 'dono',
  FINANCEIRO: 'financeiro',
  GERENTE: 'gerente',
  CONSULTOR: 'consultor',
  OPERACIONAL: 'operacional',
  // aliases legados
  vendedor: 'consultor',
  VENDEDOR: 'consultor',
  PARCEIRO: 'consultor',
  tecnico: 'operacional',
  TECNICO: 'operacional',
  OPERADOR: 'operacional',
  operador: 'operacional',
};

/** Normaliza qualquer string de role para o tipo canônico */
export function normalizeRole(role: string): Role {
  return ROLE_MAP[role] ?? 'consultor';
}

/** Verifica se a role do usuário está na lista de permitidos */
export function hasRole(userRole: string, allowed: Role[]): boolean {
  return allowed.includes(normalizeRole(userRole));
}

// ─── Regras por página ────────────────────────────────────────────────────────
const ALL: Role[] = ['admin', 'dono', 'financeiro', 'gerente', 'consultor', 'operacional'];
const ADMIN_DONO_GERENTE: Role[] = ['admin', 'dono', 'gerente'];
const ADMIN_DONO_GERENTE_CONSULTOR: Role[] = ['admin', 'dono', 'gerente', 'consultor'];
const ADMIN_DONO_GERENTE_OPERACIONAL: Role[] = ['admin', 'dono', 'gerente', 'operacional'];
const ADMIN_DONO_GERENTE_FINANCEIRO: Role[] = ['admin', 'dono', 'gerente', 'financeiro'];
const ADMIN_ONLY: Role[] = ['admin'];

export const PAGE_ROLES: Record<string, Role[]> = {
  // root / dashboard
  '/': ALL,
  '/dashboard': ALL,

  // CRM
  '/crm/clientes': ADMIN_DONO_GERENTE_CONSULTOR,
  '/crm/vendedores': ADMIN_DONO_GERENTE,
  '/crm/concessionarias': ADMIN_DONO_GERENTE_CONSULTOR,

  // Cadastros legados (redirects apontam pra cá)
  '/cadastros/cliente': ADMIN_DONO_GERENTE_CONSULTOR,
  '/cadastros/equipe': ADMIN_DONO_GERENTE,
  '/cadastros/parceiro': ADMIN_DONO_GERENTE_CONSULTOR,
  '/cadastros/meta-comissao': ADMIN_DONO_GERENTE,
  '/cadastros/usuario': ADMIN_ONLY,

  // Vendas
  '/vendas/orcamentos': ADMIN_DONO_GERENTE_CONSULTOR,
  '/vendas/orcamento': ADMIN_DONO_GERENTE_CONSULTOR,
  '/vendas/fatura': ADMIN_DONO_GERENTE_FINANCEIRO,
  '/vendas/certificados': ADMIN_ONLY,
  '/vendas/contratos': ADMIN_DONO_GERENTE,

  // Operação
  '/operacao/agenda': ADMIN_DONO_GERENTE_OPERACIONAL,
  '/operacao/boxes': ADMIN_DONO_GERENTE_OPERACIONAL,
  '/operacao/status': ALL,
  '/operacao/tarefas': ADMIN_DONO_GERENTE_OPERACIONAL,
  '/operacional/agendamento': ADMIN_DONO_GERENTE_OPERACIONAL,
  '/operacional/box': ADMIN_DONO_GERENTE_OPERACIONAL,
  '/operacional/status': ADMIN_DONO_GERENTE_OPERACIONAL,
  '/operacional/tarefas': ADMIN_DONO_GERENTE_OPERACIONAL,
  '/operacional/estoque': ADMIN_DONO_GERENTE,

  // Gestão
  '/gestao/estoque': ADMIN_DONO_GERENTE,
  '/gestao/financeiro': ADMIN_DONO_GERENTE_FINANCEIRO,
  '/gestao/financeiro/dashboard': ADMIN_DONO_GERENTE_FINANCEIRO,
  '/gestao/financeiro/contas-receber': ADMIN_DONO_GERENTE_FINANCEIRO,
  '/gestao/financeiro/contas-pagar': ADMIN_DONO_GERENTE_FINANCEIRO,
  '/gestao/financeiro/fluxo-caixa': ADMIN_DONO_GERENTE_FINANCEIRO,
  '/gestao/financeiro/relatorios': ADMIN_DONO_GERENTE_FINANCEIRO,
  '/gestao/financeiro/configuracoes': ADMIN_DONO_GERENTE_FINANCEIRO,
  '/gestao/comissoes': ADMIN_DONO_GERENTE_FINANCEIRO,
  '/inteligencia/relatorios': ADMIN_DONO_GERENTE_FINANCEIRO,
  '/inteligencia/comissoes': ADMIN_DONO_GERENTE,
  '/inteligencia/excel': ADMIN_DONO_GERENTE,

  // Configurações
  '/configuracoes': ADMIN_DONO_GERENTE,
  '/configuracoes/usuarios': ADMIN_ONLY,
  '/configuracoes/servicos': ADMIN_DONO_GERENTE,
  '/configuracoes/alterar-senha': ALL,
  '/configuracoes/tutorial': ALL,
};

/**
 * Retorna as roles permitidas para um determinado path.
 * Faz matching por prefixo para subpáginas.
 */
export function getAllowedRoles(pathname: string): Role[] | null {
  // exact match primeiro
  if (PAGE_ROLES[pathname]) return PAGE_ROLES[pathname];

  // prefixo mais longo
  const match = Object.keys(PAGE_ROLES)
    .filter((p) => p !== '/' && pathname.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];

  return match ? PAGE_ROLES[match] : null;
}

/** Verifica se o usuário pode acessar determinado path */
export function canAccessPage(userRole: string, pathname: string): boolean {
  const allowed = getAllowedRoles(pathname);
  if (!allowed) return true; // página não restrita → permite
  return hasRole(userRole, allowed);
}

// ─── Regras por ação ──────────────────────────────────────────────────────────
export const ACTIONS: Record<string, Role[]> = {
  // Clientes
  'cliente:criar': ADMIN_DONO_GERENTE_CONSULTOR,
  'cliente:editar': ADMIN_DONO_GERENTE_CONSULTOR,
  'cliente:deletar': ADMIN_DONO_GERENTE,

  // Ordens de Serviço
  'os:criar': ADMIN_DONO_GERENTE_CONSULTOR,
  'os:editar': ALL,
  'os:deletar': ADMIN_DONO_GERENTE,
  'os:atualizarStatus': ADMIN_DONO_GERENTE_OPERACIONAL,

  // Orçamentos
  'orcamento:criar': ADMIN_DONO_GERENTE_CONSULTOR,
  'orcamento:editar': ADMIN_DONO_GERENTE_CONSULTOR,
  'orcamento:deletar': ADMIN_DONO_GERENTE,

  // Configurações
  'config:editar': ADMIN_ONLY,
  'usuario:gerenciar': ADMIN_ONLY,
  'tipoOS:editar': ADMIN_DONO_GERENTE,

  // Relatórios
  'relatorio:ver': ADMIN_DONO_GERENTE_FINANCEIRO,
  'comissao:ver': ADMIN_DONO_GERENTE_FINANCEIRO,
  'estoque:editar': ADMIN_DONO_GERENTE,
};

/** Verifica se o usuário pode executar uma ação específica */
export function can(userRole: string, action: string): boolean {
  const allowed = ACTIONS[action];
  if (!allowed) return true; // ação não catalogada → permissiva
  return hasRole(userRole, allowed);
}
