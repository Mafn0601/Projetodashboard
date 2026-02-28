# 🚀 Quick Start - Backend

## Instalação Rápida

```bash
# 1. Entrar na pasta do backend
cd backend

# 2. Copiar arquivo de ambiente
cp .env.example .env

# 3. Editar .env com suas credenciais PostgreSQL
# DATABASE_URL="postgresql://user:password@localhost:5432/oficina_db"

# 4. Instalar dependências
npm install

# 5. Gerar Prisma Client
npm run prisma:generate

# 6. Executar migrations
npm run prisma:migrate

# 7. Seed inicial (opcional)
npm run db:seed

# 8. Iniciar em desenvolvimento
npm run dev
```

## Pronto! 🎉

Backend rodando em: **http://localhost:3001**

## Testar API

### Login Admin
```bash
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "admin@oficina.com",
  "senha": "admin123"
}
```

### Health Check
```bash
GET http://localhost:3001/api/health
```

## Próximos Passos

1. Configure o frontend para usar a API:
   - Crie arquivo `.env.local` no projeto Next.js
   - Adicione: `NEXT_PUBLIC_API_URL=http://localhost:3001/api`

2. Substitua os services mockados pelos reais que fazem fetch para API

3. Teste todas as funcionalidades

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start

# Prisma Studio (visualizar dados)
npm run prisma:studio

# Nova migration
npx prisma migrate dev --name nome_da_mudanca
```

## Credenciais Padrão (Seed)

- **Email:** admin@oficina.com
- **Senha:** admin123
- **Role:** ADMIN

⚠️ **IMPORTANTE:** Mude essas credenciais em produção!
