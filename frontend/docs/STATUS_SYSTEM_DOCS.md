# Quadro de Status - Documentação Técnica

## 📋 Overview

Sistema Kanban horizontal para acompanhamento de Ordens de Serviço (OS) em tempo real, organizado por 5 colunas de status:
1. **Agendados** - OS agendadas
2. **Recebidos** - OS recebidas (pronto para execução)
3. **Em Execução** - OS em andamento
4. **Finalizados** - OS prontas para entrega
5. **Entregues** - OS completamente finalizadas

---

## 📁 Estrutura de Arquivos

```
projeto_dashboard/
├── services/
│   └── statusService.ts          ← Mock data + lógica de dados
│
├── components/
│   └── status/
│       ├── index.ts              ← Exportações
│       ├── StatusCard.tsx        ← Componente de card individual
│       └── StatusColumn.tsx       ← Componente de coluna
│
└── app/
    └── operacional/
        └── status/
            └── page.tsx          ← Página principal (Kanban)
```

---

## 🔧 Componentes Técnicos

### 1. **statusService.ts**
**Responsabilidade:** Gestão de dados mockados e funções utilitárias

#### Interfaces:
```typescript
StatusCard {
  id: string;                    // ID único
  numero: string;                // 05.2
  veiculo: string;              // BYD DOI PHIN
  dataAgendamento: string;       // DD/MM/YYYY
  dataEntrega: string;           // DD/MM/YYYY
  cliente: string;               // Nome do cliente
  parceiro: string;              // Parceiro responsável
  responsavel: string;           // Pessoa responsável
  status: StatusType;            // agendado|recebido|execucao|finalizado|entregue
}

StatusColumn {
  id: string;                    // ID único da coluna
  title: string;                 // Nome exibido
  status: string;                // Tipo de status
  cards: StatusCard[];           // Array de cards
}
```

#### Funções Principais:
- `getStatusColumns()` - Retorna todas as 5 colunas com cards agrupados
- `getCardsByStatus(status)` - Filtra cards por status específico
- `moveCard(cardId, fromStatus, toStatus)` - Preparado para drag & drop

**Dados Mock:** 12 OS de exemplo distribuídas nos 5 status

---

### 2. **StatusCard.tsx**
**Responsabilidade:** Renderização individual de um card de OS

#### Props:
```typescript
interface StatusCardProps {
  card: StatusCard;
}
```

#### Elemento Renderizado:
```
┌─────────────────────────────────────┐
│ 05.2 - BYD DOI PHIN      [CÓDIGO]   │  ← Número + Veículo + Badge ID
├─────────────────────────────────────┤
│ Data Agto:     15/02/2026            │  ← Informações principais
│ Data Entrega:  20/02/2026            │
│ Cliente:       João Silva            │
│ Parceiro:      AutoCare              │
│ Responsável:   Maria Santos          │
└─────────────────────────────────────┘
```

#### Estilos:
- Tema claro/escuro automático
- Hover com shadow aumentado
- Cursor grab (prepara para drag & drop)
- Border primária: `slate-200 dark:slate-700`
- Fundo: `white dark:bg-slate-800`

---

### 3. **StatusColumn.tsx**
**Responsabilidade:** Renderização de uma coluna completa

#### Props:
```typescript
interface StatusColumnProps {
  column: StatusColumn;
}
```

#### Header da Coluna:
```
Agendados [3]    ← Título + Badge vermelha com contador
```

#### Características:
- Scroll vertical para cards (max-height: calc(100vh - 300px))
- Estado vazio quando nenhum card
- Badge vermelha com contador dinâmico
- Largura fixa (min-w-80, max-w-96)
- Atributo `data-status` para futura identificação em drag & drop

---

### 4. **page.tsx** (Status Page)
**Responsabilidade:** Integração de todos os componentes

#### Layout:
```
┌─ HEADER ─────────────────────┐
│ Quadro de Status - OS        │
│ Descrição...                 │
├─ KANBAN BOARD ───────────────┤
│ [Col1] [Col2] [Col3] [Col4] [Col5]  ← Scroll horizontal
├─ RESUMO ─────────────────────┤
│ Agendados: 3 | Recebidos: 2  │  ← Grid com contadores
