# 🎮 Guia de Uso - Frontend Reorganizado

## 🕹️ Testing Rápido - Como Testar Localmente

### 1. **Testar com seu navegador:**

```bash
# Na pasta do projeto
npm run dev
# Abre http://localhost:3000
```

### 2. **Testar criação de cliente:**
- Vai para `/cadastros/cliente`
- Preencha o formulário (Nome, E-mail, Telefone)
- Clique em "Salvar"
- Cliente aparece na tabela abaixo ✅

### 3. **Testar edição:**
- Clique em "Editar" na linha de um cliente
- O formulário se preenche com os dados
- Modifique algo e clique em "Atualizar"
- Tabela atualiza automaticamente ✅

### 4. **Testar deleção:**
- Clique em "Deletar" em uma linha
- Cliente é removido da tabela ✅

### 5. **Testar Role-Based (Admin vs User):**

**Para ver botões Editar/Deletar (Admin):**
```javascript
// No console do navegador (F12)
localStorage.setItem('currentUserRole', 'admin');
// Recarregue a página (F5)
```

**Para esconder botões (User Comum):**
```javascript
// No console
localStorage.setItem('currentUserRole', 'user');
// Recarregue
```

> **Nota:** Por padrão, qualquer página desconhecida usa role 'user'

---

## 📂 Arquivos Criados vs Modificados

| Arquivo | Status | O Quê |
|---------|--------|-------|
| `services/clienteService.ts` | ✨ NOVO | Serviço de clientes |
| `services/authService.ts` | ✨ NOVO | Serviço de auth + roles |
| `components/cliente/ClienteForm.tsx` | ✨ NOVO | Formulário de cliente |
| `components/cliente/ClienteTable.tsx` | ✨ NOVO | Tabela de clientes |
| `app/cadastros/cliente/page.tsx` | ✏️ REFATOR | Agora usa serviços |
| `FRONTEND_STRUCTURE.md` | ✨ NOVO | Documentação técnica |
| `HOW_TO_USE.md` | ✨ NOVO | Este arquivo |

---

## 🏗️ Estrutura de Pastas (Visão Rápida)

```
projeto_dashboard/
├── services/
│   ├── clienteService.ts     ← Buscar/Salvar clientes
│   └── authService.ts         ← Login/Logout/Roles
│
├── components/
│   ├── cliente/               ← NOVA PASTA
│   │   ├── ClienteForm.tsx   ← Form de criar/editar
│   │   └── ClienteTable.tsx  ← Tabela com ACL
│   │
│   └── templates/
│       └── crud-template.tsx  ← (mantém compatibilidade)
│
├── app/cadastros/cliente/
│   └── page.tsx              ← REFATORADA (usa serviços)
│
└── lib/
    └── storage.ts            ← localStorage helper
```

---

## 🔌 Como Adicionar Novo Serviço (Exemplo: Veiculoservice)

Seguindo o mesmo padrão:

```typescript
// services/veiculoService.ts
import { readArray, appendItem, updateItemById, writeArray } from '@/lib/storage';

export type Veiculo = {
  id: string;
  placa: string;
  marca: string;
  // ...
};

const KEY = 'veiculos';

export function getAll(): Veiculo[] {
  return readArray<Veiculo>(KEY);
}

export function save(veiculo: Veiculo): Veiculo[] {
  return appendItem<Veiculo>(KEY, veiculo);
}

export function update(id: string, data: Partial<Veiculo>): Veiculo[] {
  return updateItemById<Veiculo>(KEY, id, (item) => ({ ...item, ...data }));
}

export function remove(id: string): Veiculo[] {
  const current = readArray<Veiculo>(KEY);
  const next = current.filter((v) => v.id !== id);
  writeArray<Veiculo>(KEY, next);
  return next;
}
```

Depois, use em uma página igual a `/cadastros/cliente`:

```tsx
import * as veiculoService from '@/services/veiculoService';
// ... resto igual
```

---

## 🔐 Sistema de Permissões

### Implementado Agora:
- `role === 'admin'` → Acesso completo (CRUD)
- `role === 'user'` → Apenas leitura (sem botões Edit/Delete)

### Próximas Fases:
1. **Adicionar outros roles:** `gerente`, `supervisor`, etc.
2. **Esconder seções inteiras** (ex: certamente não mostra `/inteligencia/comissoes` para usuários comuns)
3. **Auditoria de ações** (log de quem fez o quê)

---

## 🐛 Troubleshooting

### Problema: "Botões Editar/Deletar não aparecem"
**Solução:**
```javascript
// Verificar role atual
console.log(localStorage.getItem('currentUserRole'));

// Setar como admin
localStorage.setItem('currentUserRole', 'admin');
```

### Problema: "Não estou vendo a mudança após salvar"
**Solução:** Recarregue a página (F5) ou reinicie o servidor:
```bash
npm run dev
```

### Problema: "Erro de import nos serviços"
**Solução:** Verifique os imports:
```typescript
// ✅ Certo
import * as clienteService from '@/services/clienteService';

// ❌ Evite
import { getAll } from '@/services/clienteService'; // (por enquanto)
```

---

## 🎯 Verificação de Tudo Está OK

- ✅ Página `/cadastros/cliente` carrega sem erros?
- ✅ Posso criar um cliente novo?
- ✅ Cliente aparece na tabela?
- ✅ Posso editar um cliente?
- ✅ Posso deletar um cliente?
- ✅ Quando `role = 'user'`, os botões desaparecem?
- ✅ Quando `role = 'admin'`, os botões aparecem?

Se TUDO está YES → **Frontend pronto para integração com API! 🚀**

---

## 📝 Notas de Desenvolvimento

### Por que localStorage internamente?
- Rápido para prototipar
- Browser-side: sem latência de rede
- Fácil de entender antes de meter Express.js
- Dados persistem entre reloads

### Entidades mapeadas:
- `clientes` → `clienteService`
- `veiculos` → `VehiclesTable` (já existe, seguir mesmo padrão)
- `usuarios` → (próximo)
- `equipes` → (próximo)
- ... etc

### Como migrar para API depois:

```typescript
// ANTES (localStorage):
export function getAll(): Cliente[] {
  return readArray<Cliente>(KEY);
}

// DEPOIS (API):
export async function getAll(): Promise<Cliente[]> {
  const res = await fetch('/api/clientes');
  return res.json();
}
```

Tudo mais continua igual! ✨

---

**Última atualização:** 26/02/2025
