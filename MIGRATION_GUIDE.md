# Guia de Migração - Usando API ao invés de LocalStorage

## Resumo
Todos os dados agora vêm do backend (Supabase) via HTTP REST API ao invés de localStorage.

## Serviços Disponíveis

### 1. **clienteServiceAPI** 
```typescript
import { clienteServiceAPI } from '@/services/clienteServiceAPI';

// Listar clientes
const clientes = await clienteServiceAPI.findAll();

// Listar com filtros
const clientes = await clienteServiceAPI.findAll({ 
  search: 'João',
  skip: 0,
  take: 20 
});

// Buscar por ID
const cliente = await clienteServiceAPI.findById('id-123');

// Criar
const novo = await clienteServiceAPI.create({
  nome: 'João',
  email: 'joao@email.com',
  telefone: '11999999999',
  // ... outros campos
});

// Atualizar
const atualizado = await clienteServiceAPI.update('id-123', {
  nome: 'João Silva'
});

// Deletar
await clienteServiceAPI.delete('id-123');
```

### 2. **agendamentoServiceAPI**
```typescript
import { agendamentoServiceAPI } from '@/services/agendamentoServiceAPI';

// Mesmo padrão que clienteServiceAPI
const agendamentos = await agendamentoServiceAPI.findAll();
const agendamento = await agendamentoServiceAPI.findById('id-123');
await agendamentoServiceAPI.create({...});
await agendamentoServiceAPI.update('id-123', {...});
await agendamentoServiceAPI.delete('id-123');
```

### 3. **ordemServicoServiceAPI**
```typescript
import { ordemServicoServiceAPI } from '@/services/ordemServicoServiceAPI';

// Padrão similar
const ordensServico = await ordemServicoServiceAPI.findAll();
// ... etc

// Atualizar status especificamente
await ordemServicoServiceAPI.updateStatus('id-123', 'FINALIZADA');
```

## Padrão de Migração

### Antes (LocalStorage)
```typescript
import * as clienteService from '@/services/clienteService';

useEffect(() => {
  const clientes = clienteService.getAll(); // Retorna dados lokais
  setClientes(clientes);
}, []);
```

### Depois (API)
```typescript
import { clienteServiceAPI } from '@/services/clienteServiceAPI';

useEffect(() => {
  const loadClientes = async () => {
    const clientes = await clienteServiceAPI.findAll();
    setClientes(clientes);
  };
  loadClientes();
}, []);
```

## Principais Mudanças

1. **Async/Await**: As funções agora retornam Promises
2. **Erro Handling**: Usar try/catch ou optional chaining
3. **API_URL**: Certifique-se que `NEXT_PUBLIC_API_URL` está definida
4. **Sem localStorage**: Não chamar `readArray`, `writeArray`, etc mais

## Páginas para Migrar

- [ ] `/cadastros/cliente/page.tsx` - Use `clienteServiceAPI`
- [ ] `/cadastros/cliente/completo/page.tsx` - Use `clienteServiceAPI`
- [ ] `/operacional/agenda/page.tsx` - Use `agendamentoServiceAPI`
- [ ] `/operacional/box/page.tsx` - Use `ordemServicoServiceAPI`
- [ ] Componentes relacionados

## Verificação

Depois de migrar, verifique no Console (F12):
- ✅ Ver logs como "✅ Clientes carregados:"
- ✅ Dados aparecerem no Supabase
- ✅ POST/PUT/DELETE funcionando
- ✅ Sem erros CORS

## Variáveis de Ambiente

Certifique-se que `.env.local` tem:
```
NEXT_PUBLIC_API_URL=https://projetodashboard-uebg.onrender.com
```

Para desenvolvimento local:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```
