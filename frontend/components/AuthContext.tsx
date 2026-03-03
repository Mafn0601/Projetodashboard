'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'vendedor' | 'tecnico';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

// Usuários MOCK para testes (fallback se API falhar)
const MOCK_USERS = [
  {
    id: 'mock-1',
    name: 'Admin',
    login: 'admin',
    email: 'admin@exemplo.com',
    password: 'admin123',
    role: 'admin' as const,
    token: 'mock-token-admin-123'
  },
  {
    id: 'mock-2',
    name: 'Vendedor',
    login: 'vendedor',
    email: 'vendedor@exemplo.com',
    password: 'vendedor123',
    role: 'vendedor' as const,
    token: 'mock-token-vendedor-123'
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // verifica se tem alguém logado no localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // manda pra tela de login se não tá autenticado
  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Tentar login via API
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha: password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Salvar token
        if (data.token) {
          localStorage.setItem('token', data.token);
        }

        // Salvar usuário
        if (data.usuario) {
          const userData: User = {
            id: data.usuario.id,
            name: data.usuario.nome,
            email: data.usuario.email,
            role: data.usuario.role || 'vendedor',
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          router.replace('/');
          return true;
        }
      }

      // Fallback: tentar usuários MOCK se API falhar
      console.log('⚠️ API não disponível, usando usuários MOCK');
      const identifier = email.trim().toLowerCase();
      const senha = password.trim();
      
      const foundUser = MOCK_USERS.find(
        u => (u.email === identifier || u.login === identifier) && u.password === senha
      );

      if (foundUser) {
        const userData: User = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          role: foundUser.role,
        };
        
        // Salvar token mock
        localStorage.setItem('token', foundUser.token);
        
        // Salvar usuário
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        router.replace('/');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      
      // Fallback: tentar usuários MOCK
      const identifier = email.trim().toLowerCase();
      const senha = password.trim();
      
      const foundUser = MOCK_USERS.find(
        u => (u.email === identifier || u.login === identifier) && u.password === senha
      );

      if (foundUser) {
        const userData: User = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          role: foundUser.role,
        };
        
        localStorage.setItem('token', foundUser.token);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        router.replace('/');
        return true;
      }

      return false;
    }
  };

  const logout = () => {
    console.log('🚪 Logout function called');
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    console.log('🚪 localStorage cleared, redirecting to /login');
    router.replace('/login');
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
