# 📋 Guia de Setup do Monorepo

## O que é um Monorepo?

Um monorepo é um repositório único que contém múltiplos projetos. No nosso caso:

- **Frontend** em `/frontend` → Deployed na Vercel
- **Backend** em `/backend` → Deployed no Render
- Ambos compartilham o mesmo repositório Git

## ✅ Estrutura Atual

```
projetodashboard/
├── frontend/                    ← Next.js 15 (Vercel)
├── backend/                     ← Node.js/Express (Render)
├── .gitignore                   ← Ignora node_modules, .env
├── README.md                    ← Documentação principal
└── ARQUITETURA.md               ← Documentação técnica
```

## 🚀 Como Usar

### Desenvolvimento Local

**Terminal 1 - Frontend:**
```bash
cd frontend
npm install
npm run dev
# Acessa: http://localhost:3000
```

**Terminal 2 - Backend:**
```bash
cd backend
npm install
cp .env.example .env
npm run dev
# Acessa: http://localhost:3001
```

### Variáveis de Ambiente

**Frontend** (`.env.local` em `frontend/`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api    # Dev
NEXT_PUBLIC_API_URL=https://seu-backend.onrender.com/api  # Prod
```

**Backend** (`.env` em `backend/`):
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/oficina
NODE_ENV=development
PORT=3001
JWT_SECRET=seu-secret-hash-aqui
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

## 📦 Instalação de Dependências

Cada projeto tem suas próprias dependências:

```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
npm install
```

⚠️ **NÃO execute `npm install` na raiz do projeto!**

## 🔧 Migrações do Banco (Backend)

```bash
cd backend

# Gerar Prisma Client (obrigatório antes de usar)
npm run prisma:generate

# Criar tabelas (primeira vez ou depois de schema.prisma alterado)
npm run prisma:migrate

# Popular com dados iniciais
npm run db:seed

# Acessar interface gráfica do Prisma
npm run prisma:studio
```

## 🌐 Deploy

### Frontend - Vercel

1. Ir em https://vercel.com
2. Conectar repositório GitHub
3. Configurar:
   - **Framework:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Install Command:** `npm install`
   - **Output Directory:** `.next`
4. Adicionar variável:
   - `NEXT_PUBLIC_API_URL=https://seu-backend.onrender.com/api`
5. Deploy automático em push

### Backend - Render

1. Ir em https://render.com
2. Criar novo **Web Service**
3. Conectar repositório GitHub
4. Configurar:
   - **Name:** oficina-backend
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Starter (gratuito) ou Starter Plus (2 vCPU)
5. Criar **PostgreSQL Database** no Render
6. Render vai criar `DATABASE_URL` automaticamente
7. Adicionar variáveis:
   - `NODE_ENV=production`
   - `JWT_SECRET=` (executar: `openssl rand -base64 32`)
   - `FRONTEND_URL=https://seu-app.vercel.app`
8. Deploy automático em push

## 🔐 Credenciais Iniciais

Após rodar `npm run db:seed` no backend:

```
Email: admin@oficina.com
Senha: admin123
```

**TODO:** Mude em produção!

## 🚨 Próximas Tarefas

- [ ] Integrar frontend com backend API (substituir mock services)
- [ ] Configurar CI/CD (GitHub Actions)
- [ ] Adicionar testes (Jest, Testing Library)
- [ ] Autoscaling e monitoring
- [ ] Backup automático do banco
- [ ] Logs centralizados (Sentry)

## 📚 Documentação

- **Root README.md** - Overview do projeto
- **ARQUITETURA.md** - Detalhes técnicos da arquitetura
- **frontend/** - Documentação do Next.js
- **backend/README.md** - Documentação da API
- **backend/QUICKSTART.md** - Quick start local
- **backend/RENDER_DEPLOY.md** - Deploy no Render
- **backend/FRONTEND_INTEGRATION.md** - Como integrar frontend

## 💡 Dicas Úteis

### Resetar banco de dados
```bash
cd backend
npm run prisma:reset  # Deleta tudo e recriar
```

### Gerar tipos TypeScript do schema
```bash
cd backend
npm run prisma:generate
```

### Ver logs do banco em tempo real
```bash
cd backend
npm run prisma:studio  # Interface web: localhost:5555
```

### Testar API localmente
```bash
# Com curl
curl -X GET http://localhost:3001/api/clientes \
  -H "Authorization: Bearer seu-token-aqui"

# Com Postman (importar requests.json)
```

### Limpar cache
```bash
# Frontend
cd frontend
rm -rf .next node_modules
npm install

# Backend
cd backend
rm -rf dist node_modules
npm install
```

## ❓ Troubleshooting

### "Command not found: npm"
```bash
# Instalar Node.js de https://nodejs.org
# Depois verificar:
node --version
npm --version
```

### "Cannot find module 'express'"
```bash
# Está na pasta certa?
cd backend
npm install
```

### "DATABASE_URL is not set"
```bash
# Criar .env no backend with:
echo "DATABASE_URL=postgresql://user:pass@localhost/db" > .env
```

### "Port 3001 is already in use"
```bash
# Backend já está rodando? Kill e reinicie:
# Windows: taskkill /F /IM node.exe
# Mac/Linux: killall node
npm run dev
```

### "Prisma migrations failed"
```bash
# Reset e tente novamente:
npm run prisma:reset
npm run db:seed
```

## 📞 Suporte

Para problemas:
1. Verificar documentação em `/docs`
2. Verificar logs de erro
3. Resetar banco e tentar novamente
4. Criar issue no GitHub com stack trace

---

**Última atualização:** 2026-02-28  
**Versão:** 1.0.0-monorepo
