# 🏢 Monorepo - Sistema de Gestão de Oficina Automotiva

Projeto full-stack com frontend (Next.js) e backend (Node.js + Express) em um único repositório.

## 📁 Estrutura do Projeto

```
projetodashboard/
│
├── frontend/                    # Next.js 15 (Vercel)
│   ├── app/                     # App Router do Next.js
│   ├── components/              # Componentes React
│   ├── services/                # Services (será integrado com API)
│   ├── lib/                     # Utilitários e hooks
│   ├── docs/                    # Documentação
│   ├── package.json
│   ├── next.config.mjs
│   ├── tsconfig.json
│   └── tailwind.config.ts
│
├── backend/                     # Node.js + Express (Render)
│   ├── src/
│   │   ├── controllers/         # Lógica HTTP
│   │   ├── services/            # Lógica de negócio
│   │   ├── routes/              # Definição de rotas
│   │   ├── middlewares/         # Auth, Error Handler
│   │   ├── validators/          # Zod schemas
│   │   ├── utils/               # JWT, Password
│   │   ├── lib/                 # Prisma
│   │   ├── prisma/              # Seed
│   │   └── server.ts            # Entry point
│   ├── prisma/
│   │   └── schema.prisma        # Schema do banco
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── README.md
│   ├── QUICKSTART.md
│   ├── RENDER_DEPLOY.md
│   └── FRONTEND_INTEGRATION.md
│
├── .gitignore
├── README.md                    # Este arquivo
└── ARQUITETURA.md               # Documentação de arquitetura
```

## 🚀 Quick Start

### Frontend (Desenvolvimento)

```bash
cd frontend
npm install
npm run dev
# Acessa em: http://localhost:3000
```

### Backend (Desenvolvimento)

```bash
cd backend
npm install
cp .env.example .env
# Edite .env com suas credenciais PostgreSQL

npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev
# Acessa em: http://localhost:3001
```

## 🌐 Endpoints da API

### Base URL
- **Desenvolvimento:** `http://localhost:3001/api`
- **Produção:** `https://oficina-backend.onrender.com/api`

### Autenticação
```
POST   /auth/login          - Fazer login
POST   /auth/register       - Registrar novo usuário
GET    /auth/me             - Dados do usuário logado
```

### Clientes
```
GET    /clientes            - Listar clientes
POST   /clientes            - Criar cliente
GET    /clientes/:id        - Buscar cliente
PUT    /clientes/:id        - Atualizar cliente
DELETE /clientes/:id        - Deletar cliente
```

### Agendamentos
```
GET    /agendamentos        - Listar agendamentos
POST   /agendamentos        - Criar agendamento
GET    /agendamentos/:id    - Buscar agendamento
PUT    /agendamentos/:id    - Atualizar agendamento
DELETE /agendamentos/:id    - Deletar agendamento
```

### Ordens de Serviço
```
GET    /ordens-servico                    - Listar (com filtros)
GET    /ordens-servico?groupByStatus=true - Agrupar por status
POST   /ordens-servico                    - Criar
GET    /ordens-servico/:id                - Buscar
PUT    /ordens-servico/:id                - Atualizar
PATCH  /ordens-servico/:id/status         - Atualizar status
DELETE /ordens-servico/:id                - Deletar
```

## 🔐 Credenciais Padrão (Seed)

```
Email: admin@oficina.com
Senha: admin123
```

⚠️ **Mude essas credenciais em produção!**

## 📦 Stack Tecnológico

### Frontend
- **Framework:** Next.js 15
- **Linguagem:** TypeScript
- **Estilo:** Tailwind CSS
- **UI:** Componentes customizados
- **Estado:** React Context
- **HTTP:** Fetch API

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Linguagem:** TypeScript
- **ORM:** Prisma
- **Banco:** PostgreSQL
- **Autenticação:** JWT
- **Segurança:** bcryptjs
- **Validação:** Zod

## 🌍 Deploy

### Frontend (Vercel)

1. Conectar repositório GitHub no Vercel
2. Configurar:
   - **Framework:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
3. Adicionar variáveis de ambiente:
   - `NEXT_PUBLIC_API_URL=https://oficina-backend.onrender.com/api`
4. Deploy automático em push

### Backend (Render)

1. Criar novo **Web Service** no Render
2. Conectar repositório GitHub
3. Configurar:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm start`
4. Criar **PostgreSQL Database** e conectar
5. Variáveis de ambiente (Render configura `DATABASE_URL` automaticamente):
   - `NODE_ENV=production`
   - `JWT_SECRET=` (gera um secret com: `openssl rand -base64 32`)
   - `FRONTEND_URL=https://seu-frontend.vercel.app`
6. Deploy automático em push

## 📊 Arquitetura

```
┌─────────────────────────┐
│   Navegador / Cliente   │
└────────────┬────────────┘
             │ HTTPS
             ↓
┌─────────────────────────────────────────┐
│   Vercel (Frontend - Next.js)           │
│   • UI Components                       │
│   • Pages & Routes                      │
│   • Authentication Flow                 │
│   • API Integration                     │
└────────────┬────────────────────────────┘
             │ HTTPS: /api/auth, /api/clientes, etc
             ↓
┌─────────────────────────────────────────┐
│   Render (Backend - Node.js + Express)  │
│   • Controllers (HTTP)                  │
│   • Services (Lógica de Negócio)        │
│   • Middlewares (Auth, Validação)       │
│   • Prisma ORM                          │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│   Render PostgreSQL Database            │
│   • 18 Tabelas (Usuarios, Clientes...)  │
│   • Backups Automáticos                 │
└─────────────────────────────────────────┘
```

## 🔧 Configuração de Ambiente

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api    # Dev
NEXT_PUBLIC_API_URL=https://seu-backend.onrender.com/api  # Prod
```

### Backend (.env)

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/oficina_db
NODE_ENV=development
PORT=3001
JWT_SECRET=seu-secret-key-aqui
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

## 📚 Documentação

- [Frontend Integration Guide](./backend/FRONTEND_INTEGRATION.md)
- [Backend Quick Start](./backend/QUICKSTART.md)
- [Render Deploy Guide](./backend/RENDER_DEPLOY.md)
- [Arquitetura Detalhada](./ARQUITETURA.md)

## 🚦 Git Workflow

```bash
# Clonar repositório
git clone https://github.com/Mafn0601/Projetodashboard.git
cd projetodashboard

# Frontend
cd frontend
npm install
npm run dev

# Backend (em outro terminal)
cd backend
npm install
npm run dev
```

## 📝 Commits

Seguimos o padrão **Conventional Commits**:

```
feat: adiciona novo recurso
fix: corrige um bug
docs: atualiza documentação
style: mudanças de formatação
refactor: refatoração de código
test: adiciona testes
chore: tarefas de desenvolvimento
```

## 🤝 Contribuindo

1. Crie uma branch: `git checkout -b feature/sua-feature`
2. Commit: `git commit -m "feat: descrição da feature"`
3. Push: `git push origin feature/sua-feature`
4. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar a documentação em `/docs`
2. Revisar issues no GitHub
3. Criar nova issue com detalhes

## 📄 Licença

MIT © 2026 Marco

## 🎯 Próximos Passos

- [ ] Integrar frontend com backend API
- [ ] Implementar testes automatizados
- [ ] Setup de CI/CD (GitHub Actions)
- [ ] Documentação de deployment
- [ ] Monitoring e logging
- [ ] Performance optimization
