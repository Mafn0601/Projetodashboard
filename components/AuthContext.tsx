'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { readArray } from '@/lib/storage';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'vendedor' | 'tecnico';
}

type EquipeUser = {
  id: string;
  login?: string;
  senha?: string;
  email?: string;
  nome?: string;
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuários mockados para demonstração
const MOCK_USERS = [
  {
    id: '1',
    name: 'Admin',
    login: 'admin',
    email: 'admin@exemplo.com',
    password: 'admin123',
    role: 'admin' as const
  },
  {
    id: '2',
    name: 'Vendedor',
    login: 'vendedor',
    email: 'vendedor@exemplo.com',
    password: 'vendedor123',
    role: 'vendedor' as const
  },
  {
    id: '3',
    name: 'Técnico',
    login: 'tecnico',
    email: 'tecnico@exemplo.com',
    password: 'tecnico123',
    role: 'tecnico' as const
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Verificar se há usuário salvo no localStorage ao montar
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500));

    const identifier = email.trim().toLowerCase();
    const senha = password.trim();

    const equipes = readArray<EquipeUser>('equipes');
    const equipeUser = equipes.find((u) => {
      const loginValue = String(u.login ?? '').trim().toLowerCase();
      const emailValue = String(u.email ?? '').trim().toLowerCase();
      const senhaValue = String(u.senha ?? '');
      return (loginValue === identifier || emailValue === identifier) && senhaValue === senha;
    });

    if (equipeUser) {
      const userFromEquipe: User = {
        id: equipeUser.id,
        name: equipeUser.nome || equipeUser.login || equipeUser.email || 'Usuario',
        email: equipeUser.email || identifier,
        role: 'vendedor'
      };
      setUser(userFromEquipe);
      localStorage.setItem('user', JSON.stringify(userFromEquipe));
      router.push('/');
      return true;
    }

    const foundUser = MOCK_USERS.find(
      u => (u.email === identifier || u.login === identifier) && u.password === senha
    );

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      router.push('/');
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
