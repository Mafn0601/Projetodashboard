# Backend - Sistema de Gestão de Oficina

Backend API REST desenvolvido com Node.js, Express, TypeScript e Prisma ORM.

## Stack Tecnológica

- **Node.js 18+**
- **Express** - Framework web
- **TypeScript** - Tipagem estática
- **Prisma** - ORM para PostgreSQL
- **JWT** - Autenticação
- **Zod** - Validação de dados
- **bcryptjs** - Hash de senhas

## Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Gerar Prisma Client
npm run prisma:generate

# Executar migrations
npm run prisma:migrate

# Seed inicial do banco (opcional)
npm run db:seed
```

## Desenvolvimento

```bash
# Rodar em modo desenvolvimento
npm run dev

# Abrir Prisma Studio (visualizar dados)
npm run prisma:studio
```

## Build e Produção

```bash
# Build
npm run build

# Iniciar produção
npm start
```

## Deploy no Render

1. Criar novo **Web Service** no Render
2. Conectar repositório GitHub
3. Configurar:
   - **Build Command:** `cd backend && npm install && npm run prisma:generate && npm run build`
   - **Start Command:** `cd backend && npm start`
   - **Root Directory:** `backend`
4. Adicionar **PostgreSQL Database** e conectar ao serviço
5. A variável `DATABASE_URL` será configurada automaticamente

## Estrutura de Pastas

```
backend/
├── src/
│   ├── controllers/     # Lógica de negócio
│   ├── middlewares/     # Middlewares (auth, errors)
│   ├── routes/          # Definição de rotas
│   ├── services/        # Serviços de dados
│   ├── utils/           # Utilitários
│   ├── prisma/          # Schema e seeds
│   ├── types/           # TypeScript types
│   └── server.ts        # Entry point
├── prisma/
│   └── schema.prisma    # Schema do banco
└── package.json
```

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Usuário logado

### Clientes
- `GET /api/clientes` - Listar todos
- `GET /api/clientes/:id` - Buscar por ID
- `POST /api/clientes` - Criar
- `PUT /api/clientes/:id` - Atualizar
- `DELETE /api/clientes/:id` - Deletar

### Agendamentos
- `GET /api/agendamentos` - Listar
- `POST /api/agendamentos` - Criar
- `PUT /api/agendamentos/:id` - Atualizar
- `DELETE /api/agendamentos/:id` - Deletar

### Status/OS
- `GET /api/status` - Listar OS por status
- `POST /api/status` - Criar OS
- `PUT /api/status/:id` - Atualizar OS
- `PATCH /api/status/:id/move` - Mover entre status

### Box
- `GET /api/box` - Listar ocupações
- `POST /api/box` - Criar ocupação
- `PUT /api/box/:id` - Atualizar

### Outros módulos
- Parceiros, Equipes, Tipos de OS, etc.
