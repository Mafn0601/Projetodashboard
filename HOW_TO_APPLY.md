# 📝 Arquivo de Aplicação - Manual de Mudanças Precisas

Este arquivo mostra EXATAMENTE como aplicar as otimizações nos seus arquivos existentes.

---

## 1️⃣ `backend/src/services/ordemServicoService.ts`

### Mudança 1: Método `findAll()` - Remodelar de include para select

**SUBSTITUIR ESTA FUNÇÃO:**
```typescript
async findAll(where?: {
  status?: string;
  clienteId?: string;
  responsavelId?: string;
  skip?: number;
  take?: number;
}) {
  // Seu código atual aqui...
  return await prisma.ordemServico.findMany({
    where,
    skip: where?.skip,
    take: where?.take,
    orderBy: { createdAt: 'desc' },
    include: {
      cliente: true,
      veiculo: true,
      responsavel: true,
      itens: true,
      boxOcupacoes: { include: { box: true } }
    }
  });
}
```

**PELA NOVA VERSÃO:**
```typescript
async findAll(filters?: {
  status?: string;
  clienteId?: string;
  responsavelId?: string;
  parceiroId?: string;  // ✅ NOVO
  skip?: number;
  take?: number;
}) {
  // ✅ Validação segura de paginação
  const safeSkip = typeof filters?.skip === 'number' && filters.skip >= 0 ? filters.skip : 0;
  const safeTake = typeof filters?.take === 'number' && filters.take >= 0 ? Math.min(filters.take, 100) : 20;

  const where: any = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.clienteId) where.clienteId = filters.clienteId;
  if (filters?.responsavelId) where.responsavelId = filters.responsavelId;
  if (filters?.parceiroId) where.parceiroId = filters.parceiroId;  // ✅ NOVO

  // ✅ Query + count em paralelo
  const [ordensServico, total] = await Promise.all([
    prisma.ordemServico.findMany({
      where,
      skip: safeSkip,
      take: safeTake,
      orderBy: { createdAt: 'desc' },
      // ✅ SELECT ESPECÍFICO (não include: true)
      select: {
        id: true,
        numeroOS: true,
        status: true,
        prioridade: true,
        dataAbertura: true,
        dataPrevisao: true,
        dataFinalizacao: true,
        valorTotal: true,
        valorDesconto: true,
        createdAt: true,
        updatedAt: true,
        cliente: {
          select: { id: true, nome: true, telefone: true }
        },
        veiculo: {
          select: { id: true, placa: true, marca: true, modelo: true }
        },
        responsavel: {
          select: { id: true, nome: true, login: true }
        },
        parceiro: {
          select: { id: true, nome: true }
        },
        _count: { select: { itens: true } }
      }
    }),
    prisma.ordemServico.count({ where })
  ]);

  return { 
    ordensServico, 
    total,
    page: Math.floor(safeSkip / safeTake) + 1,
    pageSize: safeTake,
    totalPages: Math.ceil(total / safeTake)
  };
}
```

### Mudança 2: Adicionar Novo Método `findByParceiro()`

**COPIAR E ADICIONAR:**
```typescript
async findByParceiro(
  parceiroId: string,
  filters?: { status?: string; skip?: number; take?: number }
) {
  return this.findAll({ parceiroId, ...filters });
}
```

### Mudança 3: Adicionar Novo Método `getByStatus()`

**COPIAR E ADICIONAR:**
```typescript
async getByStatus(groupByStatus: boolean = false) {
  if (!groupByStatus) return this.findAll();

  const stats = await prisma.ordemServico.groupBy({
    by: ['status'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });

  return {
    byStatus: stats.map(stat => ({
      status: stat.status,
      count: stat._count.id
    }))
  };
}
```

### Mudança 4: Método `findById()` - Atualizar (manter include, mas criar count)

**ADICIONAR ANTES DE retornar:**
```typescript
async findById(id: string) {
  const ordemServico = await prisma.ordemServico.findUnique({
    where: { id },
    include: {
      cliente: true,
      veiculo: true,
      responsavel: { select: { id: true, nome: true, email: true } },
      parceiro: { select: { id: true, nome: true } },
      agendamento: true,
      itens: { include: { tipoItem: true } },
      boxOcupacoes: { include: { box: true, responsavel: { select: { id: true, nome: true } } } },
      historico: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!ordemServico) {
    throw new AppError('Ordem de Serviço não encontrada', 404);
  }

  return ordemServico;
}
```

---

## 2️⃣ `backend/src/controllers/ordemServicoController.ts`

### Mudança 1: Método `listAll()` - Atualizar

**SUBSTITUIR:**
```typescript
listAll = asyncHandler(async (req: Request, res: Response) => {
  const { skip, take, status, clienteId, responsavelId } = req.query;

  const result = await ordemServicoService.findAll({
    skip: parseInt(String(skip)) || 0,
    take: parseInt(String(take)) || 100,
    status: String(status) || undefined,
    clienteId: String(clienteId) || undefined,
    responsavelId: String(responsavelId) || undefined
  });

  res.json(result);
});
```

**PELA NOVA VERSÃO:**
```typescript
listAll = asyncHandler(async (req: Request, res: Response) => {
  const { skip = 0, take = 20, status, clienteId, responsavelId, parceiroId } = req.query;

  // ✅ Validação de paginação
  const skipNum = parseInt(String(skip)) || 0;
  const takeNum = Math.min(parseInt(String(take)) || 20, 100);

  const result = await ordemServicoService.findAll({
    skip: skipNum,
    take: takeNum,
    status: status ? String(status).toUpperCase() : undefined,
    clienteId: String(clienteId) || undefined,
    responsavelId: String(responsavelId) || undefined,
    parceiroId: String(parceiroId) || undefined
  });

  res.json(result);
});
```

### Mudança 2: Adicionar Novo Method `findByParceiro()`

**COPIAR E ADICIONAR após `listAll`:**
```typescript
findByParceiro = asyncHandler(async (req: Request, res: Response) => {
  const { parceiroId } = req.params;
  const { skip = 0, take = 20, status } = req.query;

  const skipNum = parseInt(String(skip)) || 0;
  const takeNum = Math.min(parseInt(String(take)) || 20, 100);

  const result = await ordemServicoService.findByParceiro(parceiroId, {
    skip: skipNum,
    take: takeNum,
    status: status ? String(status).toUpperCase() : undefined
  });

  res.json(result);
});
```

### Mudança 3: Adicionar Novo Method `getStats()`

**COPIAR E ADICIONAR após `findByParceiro`:**
```typescript
getStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await ordemServicoService.getByStatus(true);
  res.json(stats);
});
```

---

## 3️⃣ `backend/src/routes/os.ts` (ou seu arquivo de rotas)

### Mudança CRÍTICA: Ordem das Rotas

**ANTES:**
```typescript
router.get('/os/:id', ordemServicoController.findById);
router.get('/os', ordemServicoController.listAll);
```

**DEPOIS (Colocar específicas ANTES de :id):**
```typescript
// ✅ ESPECÍFICAS PRIMEIRO
router.get('/os/by-parceiro/:parceiroId', ordemServicoController.findByParceiro);
router.get('/os/stats', ordemServicoController.getStats);

// GENÉRICAS DEPOIS
router.get('/os', ordemServicoController.listAll);
router.get('/os/:id', ordemServicoController.findById);
```

---

## 4️⃣ `frontend/services/ordemServicoServiceAPI.ts`

### Mudança 1: Adicionar Novas Interfaces (NO TOPO do arquivo)

**COPIAR ANTES da classe:**
```typescript
// ✅ NOVAS INTERFACES
export interface OrdemServicoListaResponse {
  ordensServico: OrdemServicoLista[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OrdemServicoLista {
  id: string;
  numeroOS: string;
  status: string;
  prioridade?: string;
  dataAbertura: string | Date;
  dataPrevisao?: string | Date;
  dataFinalizacao?: string | Date;
  valorTotal?: number;
  valorDesconto?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  cliente: {
    id: string;
    nome: string;
    telefone?: string;
  };
  veiculo: {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
  };
  responsavel?: {
    id: string;
    nome: string;
    login?: string;
  };
  parceiro?: {
    id: string;
    nome: string;
  };
  _count?: {
    itens: number;
  };
}
```

### Mudança 2: Atualizar Método `findAll()` - Return Type

**Adicionar tipo de retorno:**
```typescript
// ✅ Adicione tipo de retorno
async findAll(filters?: OrdemServicoFilters): Promise<OrdemServicoListaResponse> {
  // código existente...
  const response = await fetch(`${this.baseURL}/os?${params.toString()}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar Ordens de Serviço');
  }

  return response.json();
}
```

### Mudança 3: Adicionar Novo Método `findByParceiro()`

**COPIAR E ADICIONAR após `findAll`:**
```typescript
async findByParceiro(
  parceiroId: string,
  filters?: { skip?: number; take?: number; status?: string }
): Promise<OrdemServicoListaResponse> {
  const params = new URLSearchParams();
  if (filters?.skip !== undefined) params.append('skip', String(filters.skip));
  if (filters?.take !== undefined) params.append('take', String(filters.take));
  if (filters?.status) params.append('status', filters.status);

  const response = await fetch(
    `${this.baseURL}/os/by-parceiro/${parceiroId}?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }
  );

  if (!response.ok) {
    throw new Error(`Erro ao buscar OSs do parceiro ${parceiroId}`);
  }

  return response.json();
}
```

### Mudança 4: Adicionar Novo Método `getStats()`

**COPIAR E ADICIONAR após `findByParceiro`:**
```typescript
async getStats() {
  const response = await fetch(`${this.baseURL}/os/stats`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar estatísticas de OSs');
  }

  return response.json();
}
```

---

## 5️⃣ `frontend/app/cadastros/parceiro/[id]/page.tsx`

### Mudança Crítica: Substituir Busca de OSs

**ANTES:**
```typescript
useEffect(() => {
  const carregarOrdensServico = async () => {
    try {
      const todas = await ordemServicoServiceAPI.findAll({ take: 200 });
      const ossParceiro = todas.filter(os => os.parceiroId === id);
      setOrdensServico(ossParceiro);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    }
  };
  carregarOrdensServico();
}, [id]);
```

**DEPOIS:**
```typescript
const [resultado, setResultado] = useState<OrdemServicoListaResponse | null>(null);
const [currentPage, setCurrentPage] = useState(1);
const pageSize = 20;

useEffect(() => {
  const carregarOrdensServico = async () => {
    setLoading(true);
    setError(null);

    try {
      // ✅ MUDANÇA CRÍTICA: Usar findByParceiro
      const skip = (currentPage - 1) * pageSize;
      const resposta = await ordemServicoServiceAPI.findByParceiro(id, {
        skip,
        take: pageSize
      });
      setResultado(resposta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar OSs');
    } finally {
      setLoading(false);
    }
  };

  carregarOrdensServico();
}, [id, currentPage]);
```

### Adicionar Renderização de Paginação

**ADICIONAR DEPOIS DA TABELA:**
```typescript
{resultado && !loading && (
  <>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Número OS</th>
            <th className="text-left py-2">Cliente</th>
            <th className="text-left py-2">Status</th>
            <th className="text-left py-2">Data</th>
            <th className="text-right py-2">Valor</th>
          </tr>
        </thead>
        <tbody>
          {resultado.ordensServico.map((os) => (
            <tr key={os.id} className="border-b">
              <td className="py-2">{os.numeroOS}</td>
              <td className="py-2">{os.cliente?.nome}</td>
              <td className="py-2">{os.status}</td>
              <td className="py-2">
                {new Date(os.dataAbertura).toLocaleDateString('pt-BR')}
              </td>
              <td className="py-2 text-right">
                R$ {os.valorTotal?.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* ✅ PAGINAÇÃO */}
    <div className="mt-6 flex justify-between items-center">
      <div className="text-sm text-gray-600">
        Mostrando {(currentPage - 1) * pageSize + 1} de {resultado.total}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Anterior
        </button>

        {Array.from({ length: resultado.totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 border rounded ${
              currentPage === page ? 'bg-blue-500 text-white' : ''
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage(p => Math.min(resultado.totalPages, p + 1))}
          disabled={currentPage === resultado.totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Próximo
        </button>
      </div>
    </div>
  </>
)}
```

---

## 6️⃣ `backend/prisma/schema.prisma`

### Mudança: Adicionar Índices

**NO MODELO `OrdemServico`, ADICIONAR APÓS O ÚLTIMO CAMPO:**

```prisma
model OrdemServico {
  // ... campos existentes ...

  @@unique([numeroOS])  // ✅ Se não tiver
  
  // ✅ ÍNDICES CRÍTICOS - ADICIONAR
  @@index([clienteId])
  @@index([veiculoId])
  @@index([responsavelId])
  @@index([parceiroId])           // 🔴 CRÍTICO para /by-parceiro
  @@index([agendamentoId])
  @@index([status])
  @@index([createdAt])
  @@index([dataAbertura])
  @@index([parceiroId, status])   // 🔴 Composite
  @@index([status, createdAt])    // 🔴 Composite
  @@index([clienteId, createdAt])
}
```

### Mudança no Modelo `Box`: Remover String, Adicionar Relação

**ANTES:**
```prisma
model Box {
  // ...
  parceiro: String?   // ❌ REMOVER
  // ...
}
```

**DEPOIS:**
```prisma
model Box {
  // ... campos existentes ...
  
  parceiroId: String?              // ✅ ADICIONAR
  parceiro: Parceiro? @relation(   // ✅ ADICIONAR
    fields: [parceiroId],
    references: [id]
  )
  
  // ✅ E ADICIONAR ÍNDICE
  @@index([parceiroId])
}
```

**Depois EXECUTAR:**
```bash
cd backend
npx prisma migrate dev --name add_performance_indices
```

---

## ✅ Validação Pós-Implementação

### Teste Rápido em Terminal

```bash
# 1. Verificar se índices foram criados
psql -U seu_usuario -d seu_database -c "SELECT indexname FROM pg_indexes WHERE tablename='ordem_servico';"

# Esperado: 15+ linhas com índices novos

# 2. Testar API (curl)
curl "http://localhost:3001/api/os?skip=0&take=20"
# Esperado: { ordensServico: [...], total: X, page: 1, pageSize: 20, totalPages: Y }

curl "http://localhost:3001/api/os/by-parceiro/abc123?skip=0&take=20"
# Esperado: Same estrutura

curl "http://localhost:3001/api/os/stats"
# Esperado: { byStatus: [{ status: "...", count: N }, ...] }
```

### Teste no Frontend (DevTools)

1. Abrir DevTools → Network tab
2. Ir para `/cadastros/parceiro/[id]`
3. Procurar requisição GET `/os/by-parceiro/...`
4. Verificar:
   - Tamanho: < 50KB (vs 500KB antes)
   - Tempo: < 100ms (vs 3s antes)

---

## 🚨 Cuidados

1. **Ordem de Deplpyment:**
   - Backend PRIMEIRO (com novos métodos)
   - DEPOIS Frontend (usa novos métodos)

2. **Migration:**
   - Rodar DEPOIS de fazer deploy do backend
   - `npx prisma migrate deploy`

3. **Rollback:**
   - Se algo quebrar: `npx prisma migrate resolve --rolled-back add_performance_indices`
   - Reverter código também

---

Total de alterações: ~500 linhas de código em 6 arquivos
Tempo para aplicar: 30-60 minutos
