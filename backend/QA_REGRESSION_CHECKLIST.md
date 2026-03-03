# QA Regression Checklist (Backend)

## Como usar
- Base URL: `http://localhost:3001/api`
- Para rotas protegidas, usar `Authorization: Bearer <token>`
- Verificar sempre: status HTTP, corpo de erro e ausência de 500 em entradas inválidas.

---

## 1) Auth

### Login / Register normalização
- [ ] `POST /auth/register` com `email` em maiúsculas + espaços laterais deve criar usuário com normalização.
- [ ] Repetir `POST /auth/register` com mesmo email em caixa diferente deve falhar com erro de duplicidade (não criar novo usuário).
- [ ] `POST /auth/login` com email em caixa diferente da cadastrada deve autenticar normalmente.

### Validação de payload
- [ ] `POST /auth/login` sem `email` ou sem `senha` deve retornar 400.
- [ ] `POST /auth/register` com `email` inválido deve retornar 400.

---

## 2) Clientes, Parceiros, Equipes, Veículos

### UUID inválido em params
- [ ] `GET /clientes/abc` deve retornar 400 (não 500).
- [ ] `GET /parceiros/abc` deve retornar 400.
- [ ] `GET /equipes/abc` deve retornar 400.
- [ ] `GET /veiculos/abc` deve retornar 400.

### Paginação/filtros inválidos
- [ ] `GET /clientes?skip=-1` deve retornar 400.
- [ ] `GET /parceiros?take=-10` deve retornar 400.
- [ ] `GET /equipes?skip=abc` deve retornar 400.
- [ ] `GET /veiculos?take=999999` deve limitar paginação sem quebrar.

---

## 3) Agendamentos

### Filtros inválidos
- [ ] `GET /agendamentos?status=INVALIDO` deve retornar 400.
- [ ] `GET /agendamentos?dataInicio=foo` deve retornar 400.
- [ ] `GET /agendamentos?dataFim=foo` deve retornar 400.

### Params inválidos
- [ ] `GET /agendamentos/abc` deve retornar 400.
- [ ] `DELETE /agendamentos/abc` deve retornar 400.

---

## 4) Ordens de Serviço

### Query/status inválidos
- [ ] `GET /ordens-servico?status=INVALIDO` deve retornar 400.
- [ ] `PATCH /ordens-servico/{id}/status` com status inválido deve retornar 400.

### Params inválidos
- [ ] `GET /ordens-servico/abc` deve retornar 400.
- [ ] `DELETE /ordens-servico/abc` deve retornar 400.

---

## 5) Chamados

### Criação
- [ ] `POST /chamados` sem campos obrigatórios deve retornar 400.
- [ ] `POST /chamados` com email inválido deve retornar 400.
- [ ] `POST /chamados` com urgência fora do enum deve retornar 400.

### UUID e status
- [ ] `GET /chamados/abc` deve retornar 400.
- [ ] `PATCH /chamados/{id}/status` com body inválido deve retornar 400.
- [ ] `PATCH /chamados/{uuid-inexistente}/status` deve retornar 404 (não 500).
- [ ] `DELETE /chamados/{uuid-inexistente}` deve retornar 404.

---

## 6) Regressão técnica rápida
- [ ] Rodar `npm run build` no backend sem erros.
- [ ] Verificar logs do servidor: nenhuma exceção não tratada para cenários acima.
- [ ] Confirmar que respostas de erro seguem padrão (`error` e, quando aplicável, `details`).
