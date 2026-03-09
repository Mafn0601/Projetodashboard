'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { clienteServiceAPI } from '@/services/clienteServiceAPI';
import tipoOSServiceAPI from '@/services/tipoOSServiceAPI';
import statusServiceAPI from '@/services/statusServiceAPI';
import { parceiroServiceAPI } from '@/services/parceiroServiceAPI';
import { ordemServicoServiceAPI } from '@/services/ordemServicoServiceAPI';
import { agendamentoServiceAPI } from '@/services/agendamentoServiceAPI';
import { orcamentoServiceAPI } from '@/services/orcamentoServiceAPI';
import { equipeServiceAPI } from '@/services/equipeServiceAPI';
import boxServiceAPI from '@/services/boxServiceAPI';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'vendedor' | 'tecnico';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
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

const defaultValue: AuthContextType = {
  user: null,
  token: null,
  login: async () => false,
  logout: () => {},
  isLoading: true,
};

// Função auxiliar para propagar token para todos os serviços
function setAuthTokenInAllServices(token: string | null): void {
  clienteServiceAPI.setAuthToken(token);
  tipoOSServiceAPI.setAuthToken(token);
  statusServiceAPI.setAuthToken(token);
  parceiroServiceAPI.setAuthToken(token);
  ordemServicoServiceAPI.setAuthToken(token);
  agendamentoServiceAPI.setAuthToken(token);
  orcamentoServiceAPI.setAuthToken(token);
  equipeServiceAPI.setAuthToken(token);
  boxServiceAPI.setAuthToken(token);
}

const AuthContext = createContext<AuthContextType>(defaultValue);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // verifica se tem login e token na sessão
  useEffect(() => {
    console.log('🔄 AuthContext - Iniciando recuperação de sessão...');
    const savedUser = localStorage.getItem('user');
    let savedToken = sessionStorage.getItem('token');
    
    // Se não tem token em sessionStorage, tenta recuperar de localStorage (fallback)
    if (!savedToken) {
      savedToken = localStorage.getItem('token');
      console.log('📱 Token não encontrado em sessionStorage, recuperando de localStorage...');
    }
    
    console.log('📦 Dados salvos:', {
      user: savedUser ? 'EXISTS' : 'NULL',
      token: savedToken ? `${savedToken.substring(0, 20)}...` : 'NULL'
    });
    
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        console.log('✅ Usuário recuperado do localStorage');
      } catch {
        localStorage.removeItem('user');
        console.error('❌ Erro ao parsear usuário salvo');
      }
    }
    
    if (savedToken) {
      console.log('🔐 Token recuperado');
      setToken(savedToken);
      setAuthTokenInAllServices(savedToken);
      // Re-salva em sessionStorage para performance na sessão atual
      sessionStorage.setItem('token', savedToken);
      console.log('✅ Token propagado para todos os serviços');
    } else {
      console.warn('⚠️ Nenhum token encontrado - usuário precisa fazer login');
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
        
        if (data.token) {
          console.log('✅ Token recebido da API');
          console.log('💾 Salvando token em sessionStorage e localStorage...');
          setToken(data.token);
          setAuthTokenInAllServices(data.token);
          sessionStorage.setItem('token', data.token);
          localStorage.setItem('token', data.token);
          console.log('✅ Token salvo e propagado para todos os serviços');
        }

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
        
        // Salvar token em memória e em sessionStorage + localStorage
        console.log('⚠️ Usando usuário MOCK:', foundUser.login);
        console.log('💾 Salvando token MOCK em sessionStorage e localStorage...');
        setToken(foundUser.token);
        setAuthTokenInAllServices(foundUser.token);
        sessionStorage.setItem('token', foundUser.token);
        localStorage.setItem('token', foundUser.token);
        console.log('✅ Token MOCK salvo e propagado para todos os serviços');
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
        
        console.log('⚠️ Login fallback MOCK:', foundUser.login);
        console.log('💾 Salvando token MOCK fallback em sessionStorage e localStorage...');
        setToken(foundUser.token);
        setAuthTokenInAllServices(foundUser.token);
        sessionStorage.setItem('token', foundUser.token);
        localStorage.setItem('token', foundUser.token);
        console.log('✅ Token MOCK fallback salvo e propagado');
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        router.replace('/');
        return true;
      }

      return false;
    }
  };

  const logout = () => {
    console.log('🚪 Logout iniciado');
    setUser(null);
    setToken(null);
    setAuthTokenInAllServices(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    console.log('🚪 Autenticação limpa de sessionStorage e localStorage');
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
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
