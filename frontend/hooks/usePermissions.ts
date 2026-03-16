import { useAuth } from '@/components/AuthContext';
import { can, hasRole, normalizeRole, type Role } from '@/lib/permissions';

/**
 * Hook que expõe helpers de permissão baseados no usuário autenticado.
 *
 * Uso:
 *   const { can, isAdmin, role } = usePermissions();
 *   if (can('os:criar')) { ... }
 *   if (isAdmin) { ... }
 */
export function usePermissions() {
  const { user } = useAuth();
  const role: Role = user ? normalizeRole(user.role) : 'consultor';

  return {
    role,
    isAdmin: role === 'admin',
    isDono: role === 'dono',
    isFinanceiro: role === 'financeiro',
    isGerente: role === 'gerente',
    isConsultor: role === 'consultor',
    isOperacional: role === 'operacional',
    /** Verifica se o usuário pode executar uma ação (ex: 'os:criar') */
    can: (action: string) => can(role, action),
    /** Verifica se a role do usuário está na lista fornecida */
    hasRole: (allowed: Role[]) => hasRole(role, allowed),
  };
}
