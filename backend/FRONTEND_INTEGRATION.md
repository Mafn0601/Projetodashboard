# 🔌 Integração Frontend → Backend

## Configuração Inicial do Frontend

### 1. Variáveis de Ambiente

Crie/edite o arquivo `.env.local` na raiz do projeto Next.js:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Em produção (Vercel):
```env
NEXT_PUBLIC_API_URL=https://oficina-backend.onrender.com/api
```

### 2. Cliente HTTP (Exemplo com Fetch)

Crie `lib/api.ts`:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Pegar token do localStorage
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

// Cliente HTTP base
export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Erro na requisição');
  }

  return response.json();
}
```

## Endpoints da API

### 🔐 Autenticação

#### Login
```typescript
POST /auth/login
Body: { email: string, senha: string }
Response: { usuario: {...}, token: string }
```

Exemplo:
```typescript
import { apiClient } from '@/lib/api';

async function login(email: string, senha: string) {
  const data = await apiClient<{ usuario: any; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
  
  localStorage.setItem('token', data.token);
  return data.usuario;
}
```

#### Registrar
```typescript
POST /auth/register
Body: {
  nome: string,
  login: string,
  email: string,
  senha: string,
  role?: 'ADMIN' | 'GERENTE' | 'OPERADOR' | 'PARCEIRO'
}
Response: { usuario: {...}, token: string }
```

#### Usuário Logado
```typescript
GET /auth/me
Headers: Authorization: Bearer <token>
Response: { id, nome, email, role, ... }
```

### 👤 Clientes

#### Listar Clientes
```typescript
GET /clientes?search=<termo>&ativo=<true|false>&skip=0&take=50
Response: { clientes: [...], total: number }
```

Exemplo:
```typescript
import { apiClient } from '@/lib/api';

async function listarClientes(filtros?: {
  search?: string;
  ativo?: boolean;
  skip?: number;
  take?: number;
}) {
  const params = new URLSearchParams();
  if (filtros?.search) params.append('search', filtros.search);
  if (filtros?.ativo !== undefined) params.append('ativo', String(filtros.ativo));
  if (filtros?.skip) params.append('skip', String(filtros.skip));
  if (filtros?.take) params.append('take', String(filtros.take));

  return apiClient<{ clientes: any[]; total: number }>(
    `/clientes?${params.toString()}`
  );
}
```

#### Buscar Cliente por ID
```typescript
GET /clientes/:id
Response: { id, nome, email, telefone, veiculos: [...], ... }
```

#### Criar Cliente
```typescript
POST /clientes
Body: {
  nome: string,
  email?: string,
  telefone: string,
  cpfCnpj?: string,
  endereco?: string,
  cidade?: string,
  estado?: string,
  cep?: string
}
```

#### Atualizar Cliente
```typescript
PUT /clientes/:id
Body: <mesmos campos do POST, todos opcionais>
```

#### Deletar Cliente (Soft Delete)
```typescript
DELETE /clientes/:id
Response: { message: "Cliente desativado com sucesso" }
```

### 📅 Agendamentos

#### Listar Agendamentos
```typescript
GET /agendamentos?status=<status>&clienteId=<id>&responsavelId=<id>&dataInicio=<iso>&dataFim=<iso>
Response: { agendamentos: [...], total: number }
```

#### Criar Agendamento
```typescript
POST /agendamentos
Body: {
  clienteId: string,
  veiculoId?: string,
  responsavelId: string,
  parceiroId?: string,
  dataAgendamento: string (ISO),
  horarioAgendamento?: string,
  tipoAgendamento: string,
  descricaoServico?: string,
  observacoes?: string,
  quilometragem?: string
}
```

#### Atualizar Agendamento
```typescript
PUT /agendamentos/:id
Body: <mesmos campos do POST + status>
  status?: 'CONFIRMADO' | 'EXECUTANDO' | 'FINALIZADO' | 'CANCELADO'
```

### 📋 Ordens de Serviço

#### Listar OS (Agrupado por Status)
```typescript
GET /ordens-servico?groupByStatus=true
Response: {
  AGUARDANDO: [...],
  EM_ATENDIMENTO: [...],
  AGUARDANDO_PECAS: [...],
  EM_EXECUCAO: [...],
  CONCLUIDO: [...],
  ENTREGUE: [...]
}
```

#### Listar OS (Normal)
```typescript
GET /ordens-servico?status=<status>&clienteId=<id>
Response: { ordensServico: [...], total: number }
```

#### Criar OS
```typescript
POST /ordens-servico
Body: {
  clienteId: string,
  veiculoId: string,
  responsavelId: string,
  parceiroId?: string,
  agendamentoId?: string,
  descricao?: string,
  observacoes?: string,
  quilometragem?: string,
  dataPrevisao?: string (ISO),
  formaPagamento?: string,
  meioPagamento?: string,
  origemPedido?: 'INTERNO' | 'EXTERNO',
  prioridade?: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE'
}
Response: { id, numeroOS, ... }
```

#### Atualizar Status da OS
```typescript
PATCH /ordens-servico/:id/status
Body: {
  status: 'AGUARDANDO' | 'EM_ATENDIMENTO' | ...,
  observacao?: string
}
```

## Migração dos Services

### Antes (Mock):
```typescript
// services/clienteService.ts
export function getAll() {
  return readArray<Cliente>('clientes');
}
```

### Depois (API):
```typescript
// services/clienteService.ts
import { apiClient } from '@/lib/api';

export async function getAll() {
  const data = await apiClient<{ clientes: Cliente[] }>('/clientes');
  return data.clientes;
}
```

## Tratamento de Erros

```typescript
try {
  const cliente = await apiClient('/clientes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
    // Mostrar toast de erro para o usuário
  }
}
```

## Autenticação no Frontend

### AuthContext Atualizado

```typescript
async function login(email: string, senha: string) {
  const data = await apiClient<{ usuario: any; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
  
  localStorage.setItem('token', data.token);
  setUser(data.usuario);
  router.push('/');
}

async function logout() {
  localStorage.removeItem('token');
  setUser(null);
  router.push('/login');
}

async function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  try {
    const usuario = await apiClient('/auth/me');
    setUser(usuario);
  } catch {
    localStorage.removeItem('token');
  }
}
```

## CORS

O backend já está configurado para aceitar requisições do frontend.

Em produção, configure a variável `FRONTEND_URL` no Render para o domínio do Vercel.

## Status Codes

- `200` - Sucesso
- `201` - Criado
- `400` - Erro de validação
- `401` - Não autenticado
- `403` - Sem permissão
- `404` - Não encontrado
- `500` - Erro interno do servidor

## Próximos Passos

1. Criar `lib/api.ts` com o cliente HTTP
2. Atualizar `AuthContext` para usar a API
3. Migrar cada service (cliente, agendamento, OS, etc)
4. Remover chamadas ao localStorage
5. Testar todas as funcionalidades
6. Deploy!

🎯 **Dica:** Migre um módulo por vez (ex: Clientes primeiro, depois Agendamentos)
