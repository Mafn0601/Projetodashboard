# Guia de Integração Backend - Sistema de Status

## 🚀 Roteiro para Integração com Backend

### Fase 1: Substituição do Mock
#### Arquivos a modificar: `services/statusService.ts`

**Atualmente:**
```typescript
const mockCards: StatusCard[] = [...]

export function getStatusColumns(): StatusColumn[] {
  const columns: StatusColumn[] = [
    {
      id: "agendado",
      title: "Agendados",
      status: "agendado",
      cards: getCardsByStatus("agendado"),  // ← Filtra mock
    },
    // ... outras colunas
  ];
  return columns;
}
```

**Para integrar com backend:**
```typescript
// 1. Adicionar função para chamar API
export async function getStatusColumnsFromAPI(): Promise<StatusColumn[]> {
  try {
    const response = await fetch('/api/status/columns');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar status', error);
    return getStatusColumns(); // Fallback para mock
  }
}

// 2. Na página, usar useEffect com async
useEffect(() => {
  async function loadData() {
    const data = await getStatusColumnsFromAPI();
    setColumns(data);
  }
  loadData();
}, []);
```

### Fase 2: Implementar Drag & Drop
#### Pacote sugerido: `react-beautiful-dnd` ou `dnd-kit`

**Função preparada em statusService.ts:**
```typescript
export function moveCard(
  cardId: string,
  fromStatus: string,
  toStatus: string
): boolean {
  // Implementar chamada API para atualizar status
  // PATCH /api/os/{cardId}/status
  return true;
}
```

**No componente StatusColumn.tsx, adicionar:**
```typescript
// Usar como droppable container
<div data-status={column.status} onDrop={handleDrop}>
  {cards.map(card => (
    <div draggable onDragStart={handleDragStart}>
      <StatusCard card={card} />
    </div>
  ))}
</div>
```

### Fase 3: Real-time Updates
#### Sugerido: WebSockets ou Server-Sent Events

**Exemplo com Socket.io:**
```typescript
useEffect(() => {
  const socket = io('http://api.backend.com');
  
  socket.on('status-updated', (data: StatusCard) => {
    // Atualizar estado local
    setColumns(prev => updateCardInColumns(prev, data));
  });
  
  return () => socket.disconnect();
}, []);
```

### Fase 4: Otimizações
- **Caching:** Implementar React Query ou SWR
- **Paginação:** Carregar cards sob demanda por coluna
- **Filtros:** Adicionar filtros por cliente, parceiro, responsável
- **Search:** Implementar busca em tempo real

---

## 📡 Contrato de API Esperado

### GET /api/status/columns
**Response:**
```json
{
  "columns": [
    {
      "id": "agendado",
      "title": "Agendados",
      "status": "agendado",
      "cards": [
        {
          "id": "1",
          "numero": "05.2",
          "veiculo": "BYD DOI PHIN",
          "dataAgendamento": "15/02/2026",
          "dataEntrega": "20/02/2026",
          "cliente": "João Silva",
          "parceiro": "AutoCare",
          "responsavel": "Maria Santos",
          "status": "agendado"
        }
      ]
    }
  ]
}
```

### PATCH /api/os/{id}/status
**Request:**
```json
{
  "status": "recebido"
}
```

**Response:**
```json
{
  "success": true,
  "card": { /* Card atualizado */ }
}
```

---

## 🔄 Fluxo de Dados Atual

```
statusService.ts (mock)
         ↓
   getStatusColumns()
         ↓
   StatusPage.tsx (useMemo)
         ↓
   StatusColumn.tsx × 5
         ↓
   StatusCard.tsx × N
```

## 🔄 Fluxo de Dados Com Backend

```
Backend API
     ↓
Axios/Fetch (useEffect)
     ↓
State Management (useState/Redux/Zustand)
     ↓
StatusPage.tsx (useMemo)
     ↓
StatusColumn.tsx × 5
     ↓
StatusCard.tsx × N
```

---

## 🛠 Checklist de Implementação

- [ ] Criar endpoints no backend
- [ ] Testar contrato de API
- [ ] Remover mock data
- [ ] Implementar useEffect para carregar dados
- [ ] Adicionar error boundaries
- [ ] Implementar loading states (skeleton loaders)
- [ ] Implementar drag & drop
- [ ] Testar em produção
- [ ] Monitorar performance

---

## 💾 Persistência de Estado

**Opção 1: localStorage (temporária)**
```typescript
useEffect(() => {
  const columns = getStatusColumns();
  localStorage.setItem('statusColumns', JSON.stringify(columns));
}, []);
```

**Opção 2: Redux (recommended)**
```typescript
const dispatch = useDispatch();
const columns = useSelector(state => state.status.columns);

useEffect(() => {
  dispatch(fetchStatusColumns());
}, [dispatch]);
```

**Opção 3: Zustand (lightweight)**
```typescript
const useStatusStore = create((set) => ({
  columns: [],
  fetchColumns: async () => {
    const data = await getStatusColumnsFromAPI();
    set({ columns: data });
  }
}));
```
