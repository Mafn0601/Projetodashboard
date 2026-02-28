export type User = {
  id: string;
  nome: string;
  email: string;
  login: string;
  perfil: string;
  status: 'Ativo' | 'Inativo';
  acessoEnviado: boolean;
};

const SAMPLE_USERS: User[] = [
  {
    id: '1',
    nome: 'João Silva',
    email: 'joao.silva@example.com',
    login: 'jsilva',
    perfil: 'Admin',
    status: 'Ativo',
    acessoEnviado: true,
  },
  {
    id: '2',
    nome: 'Maria Fernandes',
    email: 'maria.fernandes@example.com',
    login: 'mfernandes',
    perfil: 'Operacional',
    status: 'Ativo',
    acessoEnviado: false,
  },
  {
    id: '3',
    nome: 'Carlos Pereira',
    email: 'carlos.pereira@example.com',
    login: 'cpereira',
    perfil: 'Comercial',
    status: 'Inativo',
    acessoEnviado: false,
  },
];

export async function getUsers(filters?: Record<string, string | string[] | undefined>) {
  await new Promise((r) => setTimeout(r, 80));

  if (!filters || Object.keys(filters).length === 0) return SAMPLE_USERS;

  const nome = (filters.nome as string) || '';
  const usuario = (filters.usuario as string) || '';
  const email = (filters.email as string) || '';
  const perfil = (filters.perfil as string) || '';
  const status = (filters.status as string) || '';

  return SAMPLE_USERS.filter((u) => {
    if (nome && !u.nome.toLowerCase().includes(nome.toLowerCase())) return false;
    if (usuario && !u.login.toLowerCase().includes(usuario.toLowerCase())) return false;
    if (email && !u.email.toLowerCase().includes(email.toLowerCase())) return false;
    if (perfil && perfil !== 'Todos' && u.perfil !== perfil) return false;
    if (status && status !== 'Todos' && u.status !== status) return false;
    return true;
  });
}
