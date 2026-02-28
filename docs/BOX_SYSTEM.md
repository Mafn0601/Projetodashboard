# Sistema de Boxes de Trabalho

## Visão Geral

O sistema de boxes de trabalho gerencia a alocação de espaços físicos de trabalho (boxes) no sistema de agendamento e status de ordens de serviço. O sistema opera com horário de funcionamento das 8h às 18h, com intervalo de almoço de 12h às 13h30.

## Configurações de Horário

- **Horário de Funcionamento**: 08:00 - 18:00 (10 horas)
- **Intervalo de Almoço**: 12:00 - 13:30 (1h30)
- **Tempo Disponível**: 8h30 por dia
- **Slot Mínimo**: 15 minutos
- **Duração Padrão**: 45 minutos a 1h30

## Estrutura

### Tipos de Boxes

O sistema suporta dois tipos de boxes:

1. **Lavagem** (`lavagem`): Boxes dedicados a serviços de lavagem e serviços relacionados
2. **Serviço Geral** (`servico_geral`): Boxes para outros tipos de serviços automotivos

### Componentes Principais

#### 1. Serviço de Boxes (`services/boxService.ts`)

Gerencia toda a lógica de boxes e ocupações:

**Principais Funções:**
- `getBoxes()`: Retorna todos os boxes cadastrados
- `getBoxesDisponiveis()`: Verifica boxes disponíveis em um período específico
- `isBoxDisponivel()`: Verifica se um box específico está disponível
- `addOcupacao()`: Cria uma nova ocupação de box
- `updateOcupacao()`: Atualiza status de uma ocupação
- `getOcupacoesBoxPorData()`: Lista ocupações de um box em uma data

**Tipos:**
```typescript
interface Box {
  id: string;
  nome: string;
  tipo: "lavagem" | "servico_geral";
  parceiroId: string;
  parceiro: string;
  ativo: boolean;
  cor?: string;
}

interface OcupacaoBox {
  id: string;
  boxId: string;
  boxNome: string;
  referencia: string; // ID do agendamento ou status
  tipoReferencia: "agendamento" | "status";
  cliente: string;
  veiculo: string;
  dataInicio: string;
  horaInicio: string;
  dataFim: string;
  horaFim: string;
  status: "agendado" | "em_uso" | "finalizado" | "cancelado";
}
```

#### 2. Página de Cadastro (`app/cadastros/box/page.tsx`)

Interface para gerenciar boxes com **dois modos de visualização**:

**Modo Timeline (padrão)**:
- Visualização gráfica de ocupação ao longo do dia
- Agrupamento por parceiro
- Grid de horários de 8h às 18h
- Slots de 15 minutos
- Cores indicando disponibilidade:
  - Verde: Disponível
  Tela de Agendamento** (`app/operacional/agendamento/page.tsx`):
- **Apenas visualização** - não permite criação manual
- Agendamentos vêm de:
  - Cadastro de Clientes
  - Criação de Orçamentos
- Exibe agendamentos dos próximos 7 dias
- Drag & drop para alterar datas
- Botão "Chegou" para mover para Status

**Campos em `AgendaItem`:**
```typescript
interface AgendaItem {
  // ... campos existentes
  boxId?: string;
  boxNome?: string;
  duracaoEstimada?: number; // em minutos (padrão: 45-90)
}
```

#### 4. Componente de Timeline (`components/box/BoxTimeline.tsx`)

Visualização gráfica de ocupação de boxes:

**Componentes**:
- `BoxTimeline`: Renderiza linha do tempo de um box
- `TimelineHeader`: Cabeçalho com as horas
- `TimelineLegend`: Legenda de cores e informações

**Funcionalidades**:
- Divide cada hora em 4 slots de 15 minutos
- Detecta automaticamente horário de almoço
- Tooltip com informações ao passar o mouse
- Cores personalizadas por box
- Adaptação automática à duração do serviço
#### 3. Integração com Agendamento

**Modal de Agendamento** (`components/agenda/AgendaFormModal.tsx`):
- Seleção de box ao criar agendamento
- Verificação automática de disponibilidade
- Indicador visual de boxes disponíveis
- Duração estimada do serviço

**Campos adicionados em `AgendaItem`:**
```typescript
interface AgendaItem {
  // ... campos existentes
  boxId?: string;
  boxNome?: string;
  duracaoEstimada?: number; // em minutos
}
```

#### 4. Integração com Status

**Campos adicionados em `StatusCard`:**
```typescript
interface StatusCard {
  // ... campos exis (Lavagem ou Serviço Geral)
   - Parceiro responsável
   - Cor de identificação
4. Salve

### 2. Visualizar Timeline de Ocupação

1. Na página de Boxes, selecione o modo **Timeline**
2. Escolha a data desejada
3. Visualize a ocupação de todos os boxes agrupados por parceiro
4. Cores indicam disponibilidade:
   - **Verde**: Box livre
   - **Vermelho**: Box ocupado
   - **Cinza**: Horário de almoço

### 3. Criar Agendamento com Box

Os agendamentos são criados **automaticamente** ao:

**A) Cadastrar Cliente com Agendamento:**
1. Vá em Vendas → Cliente
2. Preencha dados do cliente
3. Marque "Agendar serviço"
4. Selecione data, horário e duração
5. Escolha um box disponível (se houver)
6. Sistema cria agendamento e ocupa o box

**B) Criar Orçamento:**
1. Vá em Vendas → Orçamento
2. Crie orçamento com data de agendamento
3. Sistema aloca box automaticamente se disponível

### 4. Verificar Disponibilidade

**Sistema automático:**
- Calcula slots de 15 minutos
- Verifica sobreposição de horários
- Considera duração do serviço
- Exclui horário de almoço (12h-13h30)
- Respeita limite de funcionamento (8h-18h)

**Exemplo de cálculo:**
- Serviço de 1h30 iniciando às 10h
- Ocupa: 10:00, 10:15, 10:30, 10:45, 11:00, 11:15
- Box fica indisponível até 1considerando:

### Horários de Funcionamento
- **Início**: 08:00
- **Fim**: 18:00
- **Almoço**: 12:00 - 13:30 (bloqueado)
- **Total disponível**: 8h30/dia

### Slots de Tempo
- **Granularidade**: 15 minutos
- **Slots por hora**: 4
- **Slots por dia**: 34 (excluindo almoço)

### Algoritmo de Verificação
1. Converte horários para decimal (ex: 10:30 = 10.5)
2. Verifica se período solicitado sobrepõe período existente
3. Considera apenas ocupações ativas (agendado/em_uso)
4. Ignora ocupações canceladas/finalizadas
5. Bloqueia automaticamente horário de almoço

**Exemplo prático:**
```
Box 1 - Dia 27/02:
├─ 08:00 - 09:30 ✅ Lavagem Completa (90min)
├─ 09:30 - 10:00 🟢 Livre
├─ 10:00 - 11:15 ✅ Polimento (75min)
├─ 11:15 - 12:00 🟢 Livre
├─ 12:00 - 13:30 🍽️ ALMOÇO
├─ 13:30 - 15:00 ✅ Revisão (90min)
├─ 15:00 - 18:00 🟢 Livre
- Clique no ícone de calendário 📅 em qualquer box
- Visualize todas as ocupações do dia atual

**Ao criar agendamento:**
- O sistema verifica automaticamente a disponibilidade
- Mostra contador de boxes disponíveis
- Alerta se nenhum box estiver livre

### 4. Transição Agendamento → Status

Quando um agendamento vira status (cliente chegou):
1. O box alocado é transferido para o status
2. A ocupação passa de "agendado" para "em_uso"
3. O box é exibido no card de status
4. A referência da ocupação aponta para o novo status

### 5. Visualizar Box no Status

- O nome do box aparece nos cards de status
- No modal de detalhes, o box é mostrado na seção "Responsabilidade"

## Verificação de Disponibilidade

O sistema verifica conflitos de horários considerando:

- **Data e hora de início**
- **Data e hora de fim**
- **Ocupações ativas** (agendado ou em_uso)
- **Sobreposição de períodos**

**Exemplo:**
```
Box 1:
├─ 09:00 - 11:00 (Agendado - Lavagem Completa)
├─ 14:00 - 15:30 (Em Uso - Polimento)
└─ Disponível: 11:00-14:00, após 15:30
```

## Dados Mock

O sistema inicializa automaticamente com 5 boxes de exemplo:
- 2 boxes de lavagem
- 3 boxes de serviço geral

Para inicializar os dados mock:
```typescript
import { initializeMockBoxes } from '@/services/boxService';
initializeMockBoxes();
```

## Storage

Os dados são armazenados no localStorage:
- **boxes**: Lista de boxes cadastrados
- **ocupacoes_box**: Lista de ocupações/alocações

## Cores Disponíveis

O sistema oferece 8 cores para identificação visual dos boxes:
- Azul (#3b82f6)
- Ciano (#06b6d4)
- Violeta (#8b5cf6)
- Rosa (#ec4899)
- Âmbar (#f59e0b)
- Verde (#10b981)
- Vermelho (#ef4444)
- Índigo (#6366f1)

## Validações

### Ao criar/editar Box:
- Nome obrigatório
- Tipo obrigatório
- Parceiro obrigatório
- Validação de parceiro ativo ao salvar

### Ao alocar Box:
- Verificação de disponibilidade no período
- Validação de sobreposição de horários
- Duração mínima de 15 minutos

## Status de Ocupação

| Status | Descrição |
|--------|-----------|
| `agendado` | Box reservado para agendamento futuro |
| `em_uso` | Box atualmente ocupado (em execução) |
| `finalizado` | Serviço concluído |
| `cancelado` | Ocupação cancelada |

Ocupações com status `finalizado` ou `cancelado` não impedem novas alocações.

## Próximas Melhorias Sugeridas

1. **Visualização de Timeline**: Gráfico de Gantt mostrando ocupação dos boxes ao longo do dia
2. **Notificações**: Alertas quando box for liberado
3. **Relatórios**: Análise de utilização dos boxes
4. **Histórico**: Visualização de ocupações passadas
5. **Reserva Recorrente**: Agendar ocupações repetidas
6. **Manutenção de Box**: Marcar períodos de manutenção onde box fica indisponível
7. **Priorização**: Sistema de prioridade para alocação de boxes

## Integração Futura com Backend

Quando integrar com backend, substituir as funções de localStorage por calls HTTP:

```typescript
// Exemplo de adaptação
export async function getBoxes(): Promise<Box[]> {
  const response = await fetch('/api/boxes');
  return response.json();
}

export async function addBox(box: Omit<Box, "id">): Promise<Box> {
  const response = await fetch('/api/boxes', {
    method: 'POST',
    body: JSON.stringify(box),
  });
  return response.json();
}
```

## Troubleshooting

**Box não aparece como disponível mesmo estando livre:**
- Verifique se o box está marcado como ativo
- Confirme que não há ocupações sobrepostas
- Verifique o intervalo de data/hora

**Ocupação não é criada:**
- Verifique se o box existe e está ativo
- Confirme que os dados de data/hora estão no formato correto
- Verifique o console para erros de validação

**Box não aparece no agendamento/status:**
- Verifique se `boxId` e `boxNome` foram salvos corretamente
- Confirme que a ocupação foi criada com a referência correta
