/**
 * RBAC - Role-Based Access Control
 *
 * Roles do sistema:
 *   admin       → acesso total
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

export type Role = 'admin' | 'gerente' | 'consultor' | 'operacional';

const ROLE_MAP: Record<string, Role> = {
  // canonical
  admin: 'admin',
  gerente: 'gerente',
  consultor: 'consultor',
  operacional: 'operacional',
  // uppercase (vindo direto do JWT do backend)
  ADMIN: 'admin',
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
const ALL: Role[] = ['admin', 'gerente', 'consultor', 'operacional'];
const ADMIN_GERENTE: Role[] = ['admin', 'gerente'];
const ADMIN_GERENTE_CONSULTOR: Role[] = ['admin', 'gerente', 'consultor'];
const ADMIN_GERENTE_OPERACIONAL: Role[] = ['admin', 'gerente', 'operacional'];
const ADMIN_ONLY: Role[] = ['admin'];

export const PAGE_ROLES: Record<string, Role[]> = {
  // root / dashboard
  '/': ALL,
  '/dashboard': ALL,

  // CRM
  '/crm/clientes': ADMIN_GERENTE_CONSULTOR,
  '/crm/vendedores': ADMIN_GERENTE,
  '/crm/concessionarias': ADMIN_GERENTE_CONSULTOR,

  // Cadastros legados (redirects apontam pra cá)
  '/cadastros/cliente': ADMIN_GERENTE_CONSULTOR,
  '/cadastros/equipe': ADMIN_GERENTE,
  '/cadastros/parceiro': ADMIN_GERENTE_CONSULTOR,
  '/cadastros/tipo-os': ADMIN_GERENTE,
  '/cadastros/meta-comissao': ADMIN_GERENTE,
  '/cadastros/usuario': ADMIN_ONLY,

  // Vendas
  '/vendas/orcamentos': ADMIN_GERENTE_CONSULTOR,
  '/vendas/orcamento': ADMIN_GERENTE_CONSULTOR,
  '/vendas/ordens-servico': ALL,
  '/vendas/fatura': ADMIN_GERENTE,
  '/vendas/certificados': ADMIN_GERENTE,
  '/vendas/contratos': ADMIN_GERENTE,

  // Operação
  '/operacao/agenda': ADMIN_GERENTE_OPERACIONAL,
  '/operacao/boxes': ADMIN_GERENTE_OPERACIONAL,
  '/operacao/status': ADMIN_GERENTE_OPERACIONAL,
  '/operacao/tarefas': ADMIN_GERENTE_OPERACIONAL,
  '/operacional/agendamento': ADMIN_GERENTE_OPERACIONAL,
  '/operacional/box': ADMIN_GERENTE_OPERACIONAL,
  '/operacional/status': ADMIN_GERENTE_OPERACIONAL,
  '/operacional/tarefas': ADMIN_GERENTE_OPERACIONAL,
  '/operacional/estoque': ADMIN_GERENTE,

  // Gestão
  '/gestao/estoque': ADMIN_GERENTE,
  '/gestao/financeiro': ADMIN_GERENTE,
  '/gestao/comissoes': ADMIN_GERENTE,
  '/inteligencia/relatorios': ADMIN_GERENTE,
  '/inteligencia/comissoes': ADMIN_GERENTE,
  '/inteligencia/excel': ADMIN_GERENTE,

  // Configurações
  '/configuracoes': ADMIN_GERENTE,
  '/configuracoes/usuarios': ADMIN_ONLY,
  '/configuracoes/servicos': ADMIN_GERENTE,
  '/configuracoes/tipos-os': ADMIN_GERENTE,
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
  'cliente:criar': ADMIN_GERENTE_CONSULTOR,
  'cliente:editar': ADMIN_GERENTE_CONSULTOR,
  'cliente:deletar': ADMIN_GERENTE,

  // Ordens de Serviço
  'os:criar': ADMIN_GERENTE_CONSULTOR,
  'os:editar': ALL,
  'os:deletar': ADMIN_GERENTE,
  'os:atualizarStatus': ADMIN_GERENTE_OPERACIONAL,

  // Orçamentos
  'orcamento:criar': ADMIN_GERENTE_CONSULTOR,
  'orcamento:editar': ADMIN_GERENTE_CONSULTOR,
  'orcamento:deletar': ADMIN_GERENTE,

  // Configurações
  'config:editar': ADMIN_ONLY,
  'usuario:gerenciar': ADMIN_ONLY,
  'tipoOS:editar': ADMIN_GERENTE,

  // Relatórios
  'relatorio:ver': ADMIN_GERENTE,
  'comissao:ver': ADMIN_GERENTE,
  'estoque:editar': ADMIN_GERENTE,
};

/** Verifica se o usuário pode executar uma ação específica */
export function can(userRole: string, action: string): boolean {
  const allowed = ACTIONS[action];
  if (!allowed) return true; // ação não catalogada → permissiva
  return hasRole(userRole, allowed);
}
