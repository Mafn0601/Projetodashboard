# Render Deploy Configuration

Este arquivo documenta como fazer o deploy do backend no Render.

## Pré-requisitos

1. Conta no [Render](https://render.com)
2. Repositório no GitHub com o código
3. PostgreSQL configurado no Render

## Passos para Deploy

### 1. Criar PostgreSQL Database

1. No dashboard do Render, clique em **"New +"** → **"PostgreSQL"**
2. Preencha:
   - **Name:** `oficina-db`
   - **Database:** `oficina_db`
   - **User:** (gerado automaticamente)
   - **Region:** escolha a mais próxima
   - **Plan:** Free ou Starter
3. Clique em **"Create Database"**
4. Aguarde a criação (pode levar alguns minutos)
5. Copie a **Internal Database URL** (será usada no Web Service)

### 2. Criar Web Service

1. No dashboard do Render, clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub
3. Preencha as configurações:

#### Build & Deploy

```
Name: oficina-backend
Region: (mesma do banco de dados)
Branch: main
Root Directory: backend
```

#### Build Command
```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

#### Start Command
```bash
npm start
```

#### Environment Variables

Adicione as seguintes variáveis:

```
DATABASE_URL = (cole a Internal Database URL do PostgreSQL)
NODE_ENV = production
JWT_SECRET = (gere um secret forte, ex: openssl rand -base64 32)
JWT_EXPIRES_IN = 7d
FRONTEND_URL = https://seu-frontend.vercel.app
PORT = 10000
```

4. Clique em **"Create Web Service"**

### 3. Seed Inicial (Opcional)

Após o primeiro deploy, você pode rodar o seed:

1. Vá em **"Shell"** no painel do Render
2. Execute:
```bash
npm run db:seed
```

Isso criará:
- Usuário admin (email: `admin@oficina.com`, senha: `admin123`)
- Parceiro exemplo
- 5 boxes
- Tipos de OS padrão

### 4. Configurar Frontend

No seu projeto Next.js (Vercel), adicione a variável:

```
NEXT_PUBLIC_API_URL=https://oficina-backend.onrender.com/api
```

## Estrutura de Deploy

```
┌─────────────────┐
│   Vercel        │
│   (Frontend)    │
│   Next.js       │
└────────┬────────┘
         │ HTTPS
         ↓
┌─────────────────┐
│   Render        │
│   (Backend)     │
│   Node.js/      │
│   Express       │
└────────┬────────┘
         │ Internal
         ↓
┌─────────────────┐
│   Render        │
│   PostgreSQL    │
└─────────────────┘
```

## Migrations

### Criar nova migration

Localmente:
```bash
npx prisma migrate dev --name descricao_mudanca
```

### Aplicar em produção

As migrations são aplicadas automaticamente no build command via:
```bash
npx prisma migrate deploy
```

## Monitoramento

- **Logs:** Acesse a aba "Logs" no Render
- **Metrics:** Verifique uso de CPU/memória
- **Health Check:** `https://sua-api.onrender.com/api/health`

## Troubleshooting

### Erro de Connection ao DB
- Verifique se a `DATABASE_URL` está correta
- Confirme que o banco foi criado com sucesso

### Build Fails
- Verifique os logs de build
- Confirme que todas as dependências estão no `package.json`
- Teste o build localmente: `npm run build`

### App Crashes
- Verifique o `JWT_SECRET` está configurado
- Confirme que as migrations foram aplicadas
- Check os logs de runtime

## Custos

### Plan Free
- PostgreSQL: 256MB RAM, 1GB storage
- Web Service: 512MB RAM, 100 horas/mês

### Plan Starter ($7/mês cada)
- PostgreSQL: 1GB RAM, 10GB storage
- Web Service: 512MB RAM, sempre ligado

## Backup

Render faz backup automático do PostgreSQL nos plans pagos.

Para plan free, faça backup manual:
```bash
pg_dump $DATABASE_URL > backup.sql
```

## Health Check Endpoint

O backend expõe um endpoint de health check:

```
GET /api/health
```

Resposta:
```json
{
  "status": "OK",
  "timestamp": "2026-02-28T..."
}
```
