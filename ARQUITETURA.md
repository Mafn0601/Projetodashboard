# 🏗️ Arquitetura do Sistema

## Visão Geral

Sistema de gestão de oficina automotiva com arquitetura em monorepo. Frontend e backend desacoplados, cada um com responsabilidade clara.

## Camadas de Arquitetura

### Frontend (Next.js)

```
┌─────────────────────────────────────────┐
│       Presentation Layer                │
│   ├── Pages (app/cadastros/...)        │
│   ├── Components (components/)          │
│   └── UI Elements (components/ui/)      │
├─────────────────────────────────────────┤
│       State Management Layer             │
│   ├── React Context (AuthContext)       │
│   ├── useModal, useFilter Hooks         │
│   └── Local Storage (storage.ts)        │
├─────────────────────────────────────────┤
│       Service Layer                     │
│   ├── clienteService                    │
│   ├── agendamentoService                │
│   ├── statusService                     │
│   └── (future) API Client               │
├─────────────────────────────────────────┤
│       HTTP Layer                        │
│   └── Fetch API (será integrado)        │
└─────────────────────────────────────────┘
```

**Responsabilidades:**
- Renderizar interface de usuário
- Capturar interações do usuário
- Validação de formulários (client-side)
- Gerenciar estado local
- Fazer requisições ao backend

### Backend (Node.js + Express)

```
┌─────────────────────────────────────────┐
│       HTTP Layer (Express)              │
│   └── routes/index.ts                   │
├─────────────────────────────────────────┤
│       Middleware Layer                  │
│   ├── authenticate (JWT)                │
│   ├── authorize (roles)                 │
│   ├── parseBody                         │
│   └── errorHandler                      │
├─────────────────────────────────────────┤
│       Controller Layer                  │
│   ├── AuthController                    │
│   ├── ClienteController                 │
│   ├── AgendamentoController             │
│   └── OrdemServicoController            │
├─────────────────────────────────────────┤
│       Validator Layer                   │
│   └── Zod Schemas (validation)          │
├─────────────────────────────────────────┤
│       Service Layer                     │
│   ├── AuthService                       │
│   ├── ClienteService                    │
│   ├── AgendamentoService                │
│   └── OrdemServicoService               │
├─────────────────────────────────────────┤
│       Repository Layer                  │
│   └── Prisma ORM                        │
├─────────────────────────────────────────┤
│       Database Layer                    │
│   └── PostgreSQL                        │
└─────────────────────────────────────────┘
```

**Responsabilidades:**
- Receber requisições HTTP
- Validar dados (Zod)
- Autenticar usuário (JWT)
- Processar lógica de negócio
- Persistir dados (Prisma)
- Retornar respostas JSON

## Fluxo de Dados

### Autenticação (Login)

```
Frontend                          Backend
   │                                │
   │─── POST /login ────────────────→│
   │    {email, senha}              │
   │                                │
   │                           1. FindUser (Prisma)
   │                           2. Compare Password (bcryptjs)
   │                           3. Generate JWT (utils/jwt)
   │                                │
   │←──── 200 OK ───────────────────│
   │     {token, user}              │
   │                                │
   └─ Salva token em localStorage


Frontend                Backend
   │                      │
   │─ Authorization ──→  JWT Verify
   │  Bearer token       (utils/jwt)
   │                      │
   │                    Adiciona user
   │                    no req object
```

### Criar Cliente

```
Frontend                                Backend
   │                                      │
   │─── POST /clientes ─────────────────→│
   │    {nome, email, telefone, ...}     │
   │                                      │
   │                               1. Zod Validate
   │                               2. Check Duplicate
   │                               3. Service.create()
   │                               4. Prisma.create()
   │                               5. Log Action
   │                                      │
   │←──── 201 Created ──────────────────│
   │     {id, nome, email, ...}         │
   │                                      │
   └─ Atualiza lista em tela
```

### Listar Clientes com Filtro

```
Frontend                              Backend
   │                                      │
   │─ GET /clientes?status=ativo ──────→│
   │    &page=1&limit=10                 │
   │                                      │
   │                               1. Zod Validate
   │                               2. Build where clause
   │                               3. Calculate skip/take
   │                               4. Prisma.findMany()
   │                               5. Prisma.count()
   │                               6. Map response
   │                                      │
   │←──── 200 OK ──────────────────────│
   │     {data: [...], total: 50, ...}  │
   │                                      │
   └─ Renderiza tabela com paginação
```

## Modelos de Dados

### Usuario
```typescript
- id: UUID
- email: String (unique)
- senha: String (hashed bcrypt)
- nome: String
- role: 'ADMIN' | 'GERENTE' | 'OPERADOR' | 'PARCEIRO'
- departamento: String (opcional)
- acessoModulos: String[]
- ativo: Boolean
- createdAt: DateTime
- updatedAt: DateTime
```

### Cliente
```typescript
- id: UUID
- nome: String (unique)
- email: String (unique)
- telefone: String (unique)
- cpf: String (unique)
- endereco: String
- cidade: String
- estado: String
- cep: String
- origemPedido: 'WEBSITE' | 'TELEFONE' | 'INDICACAO' | 'EXTERNO'
- status: 'ATIVO' | 'INATIVO'
- veiculos: Veiculo[]
- agendamentos: Agendamento[]
- createdAt: DateTime
- updatedAt: DateTime
```

### Veiculo
```typescript
- id: UUID
- clienteId: UUID
- placa: String (unique)
- modelo: String
- marca: String
- ano: Integer
- cor: String
- ordemServicos: OrdemServico[]
- createdAt: DateTime
- updatedAt: DateTime
```

### Agendamento
```typescript
- id: UUID
- clienteId: UUID
- VeiculoId: UUID
- dataHora: DateTime
- tipo: 'REVISAO' | 'REPARO' | 'MANUTENCAO'
- descricao: String
- status: 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO'
- createdAt: DateTime
- updatedAt: DateTime
```

### OrdemServico (OS)
```typescript
- id: UUID
- agendamentoId: UUID (opcional)
- veiculoId: UUID
- numero: String (unique)
- descricao: String
- dataInicio: DateTime
- dataPrevisao: DateTime
- dataConclusao: DateTime (opcional)
- status: 'CRIADA' | 'INICIADA' | 'PARADA' | 'FINALIZADA' | 'CANCELADA'
- prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'
- boxId: UUID (opcional - qual box está sendo executada)
- paciereId: UUID (opcional)
- itens: ItemOS[]
- createdAt: DateTime
- updatedAt: DateTime
```

## Padrões de Design

### Controller
```typescript
// Pattern
export const create = async (req, res) => {
  try {
    // 1. Validar input
    const data = schema.parse(req.body);
    
    // 2. Chamar service
    const result = await service.create(data);
    
    // 3. Retornar sucesso
    res.status(201).json(result);
  } catch (error) {
    // Middleware de erro trata
    next(error);
  }
};
```

### Service
```typescript
// Pattern
export const create = async (data: CreateDTO) => {
  // 1. Validações de negócio
  const exists = await prisma.cliente.findUnique({...});
  if (exists) throw new Error('Já existe');
  
  // 2. Processar dados
  const processed = processData(data);
  
  // 3. Persistir
  const result = await prisma.cliente.create({...});
  
  // 4. Registrar log
  logger.info(`Cliente criado: ${result.id}`);
  
  return result;
};
```

### Middleware
```typescript
// Pattern
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Não autorizado' });
  }
};
```

## Integração Frontend + Backend

### Cliente HTTP (será implementado)

```typescript
// services/api.ts
export const apiClient = {
  auth: {
    login: (email, senha) => 
      fetch('/api/auth/login', {method: 'POST', body: ...}),
    register: (data) => 
      fetch('/api/auth/register', {method: 'POST', body: ...}),
  },
  clientes: {
    list: (filters) => 
      fetch('/api/clientes?' + new URLSearchParams(filters)),
    create: (data) => 
      fetch('/api/clientes', {method: 'POST', body: ...}),
    update: (id, data) => 
      fetch(`/api/clientes/${id}`, {method: 'PUT', body: ...}),
    delete: (id) => 
      fetch(`/api/clientes/${id}`, {method: 'DELETE'}),
  },
  // ... mais recursos
};
```

### Hook de Dados (será implementado)

```typescript
// hooks/useClientes.ts
export const useClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetch = useCallback(async (filters) => {
    setLoading(true);
    try {
      const response = await apiClient.clientes.list(filters);
      setClientes(response.data);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { clientes, loading, fetch };
};
```

## Segurança

### Autenticação JWT
- Token gerado no login
- Armazenado em localStorage
- Enviado em Authorization: Bearer header
- Verificado em cada requisição

### Validação de Dados
- Zod schemas no backend
- Validação client-side no frontend
- Tipagem TypeScript strict

### Hash de Senhas
- bcryptjs 10 rounds
- Armazenado hashed no banco
- Nunca transmitido em texto plano

### Autorização por Role
- ADMIN: Acesso total
- GERENTE: Gerencia operações
- OPERADOR: Executa tarefas
- PARCEIRO: Acesso limitado

## Tratamento de Erros

### Backend
```
HTTP Status          Use Case
400 Bad Request      Validação falhou
401 Unauthorized     Token inválido/expirado
403 Forbidden        Sem permissão para recurso
404 Not Found        Recurso não existe
409 Conflict         Violação de constraint (duplicado)
500 Server Error     Erro interno
```

### Frontend
```
Erro de Conexão   → Mostrar mensagem de retry
Erro 401          → Redirecionar para login
Erro 403          → Mostrar mensagem de acesso negado
Erro 404          → Mostrar mensagem de recurso não encontrado
Erro 500          → Mostrar mensagem de erro do servidor
Erro de Validação → Mostrar erros específicos do formulário
```

## Performance

### Otimizações
- Paginação em listas (limit/offset)
- Índices no banco (email, cpf, placa)
- Select apenas colunas necessárias
- Caching de dados estáticos
- Lazy loading de componentes React

### Monitoramento
- Logs estruturados (info, warn, error)
- Tracking de erro (stack trace)
- Métricas de resposta (tempo, tamanho)

## Deployment

### Frontend (Vercel)
- Deploy automático em push
- Preview deployments em branches
- Environment variables (NEXT_PUBLIC_API_URL)
- Next.js Image Optimization

### Backend (Render)
- Deploy automático em push
- PostgreSQL gerenciado
- Environment variables seguras
- Auto-restart em crash
- Backups automáticos

---

**Atualizado em:** 2026-02-28  
**Versão:** 1.0.0
