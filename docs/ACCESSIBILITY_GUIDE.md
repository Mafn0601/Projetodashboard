# Guia de Acessibilidade e Usabilidade

Este documento descreve as melhorias implementadas para tornar a plataforma mais acessível e intuitiva para usuários com dificuldade com tecnologia.

## ✅ Melhorias Implementadas

### 1. **Tema Visual Acessível**
- ✅ Mudança de tema escuro para claro (melhor contraste)
- ✅ Cores de alto contraste para melhor legibilidade
- ✅ Fontes maiores por padrão (base 16px → 18px)
- ✅ Espaçamento aumentado entre elementos

### 2. **Componentes de UI Melhorados**
- ✅ **Botões**: Tamanho aumentado (md: 12px → 16px, lg: 14px)
- ✅ **Inputs**: Altura aumentada (9px → 12px), fontes maiores
- ✅ **Modais**: Design mais limpo, botões maiores, melhor contraste
- ✅ **Tabelas**: Texto maior, espaçamento aumentado, cores mais claras

### 3. **Componentes Novos para Melhor UX**
- ✅ **HelpBox**: Caixa de instrução com dicas úteis
- ✅ **Card**: Containers padronizados para conteúdo
- ✅ **Breadcrumb**: Navegação com trilha de migalhas
- ✅ **StatusBadge**: Indicadores de status visuais
- ✅ **Section**: Seções organizadas em páginas

### 4. **Sidebar Melhorada**
- ✅ Tema claro com melhor legibilidade
- ✅ Ícones maiores (h-5 w-5)
- ✅ Texto maior (text-base vs text-xs)
- ✅ Cores de ativo claro (azul brilhante)
- ✅ Melhor espaçamento entre itens

### 5. **Dashboard Principal**
- ✅ Título grande e claro (4xl)
- ✅ Descrição descritiva
- ✅ Cards coloridos com gradientes (melhor identificação)
- ✅ HelpBox de boas-vindas
- ✅ Números grandes e claros

### 6. **Página de Clientes**
- ✅ HelpBox com instruções claras
- ✅ Card principal com organização clara
- ✅ Tabela com melhor visual
- ✅ Botão "Novo Cliente" mais proeminente
- ✅ Feedback visual ao passar o mouse

### 7. **CSS Global**
- ✅ Scroll smooth (melhor experiência)
- ✅ Font smoothing melhorado
- ✅ Focus-visible customizado (anel azul)
- ✅ Scrollbar estilizado
- ✅ Transições suaves em interações

## 🎯 Recomendações para Prosseguir

### Próximas Melhorias
1. **Adicionar tooltips** em botões e ícones confusos
2. **Implementar modo dark** opcional (para usuários que preferem)
3. **Adicionar aria labels** em todos os botões
4. **Criar página de ajuda** com tutorial completo
5. **Adicionar validações claras** em formulários
6. **Mobile-first design** - tornar responsivo melhor
7. **Adicionar animações sutis** para feedback visual

### Componentes a Melhorar
- `ClienteVeiculoModal` - aplicar novo design
- `VehicleForm` - aumentar fontes e espaçamento
- `FilterVehicleForm` - melhorar visual
- Todas as páginas de cadastro - padronizar com Card
- Formulários em geral - melhorar labels e validações

### Padrões de Design
Use os seguintes componentes em novas páginas:
```tsx
import { Card } from '@/components/ui/Card';
import { HelpBox } from '@/components/ui/HelpBox';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Section } from '@/components/ui/Section';

export default function MyPage() {
  return (
    <div className="space-y-6">
      <HelpBox 
        title="O que isto faz?"
        message="Descrição clara do que o usuário pode fazer aqui"
        variant="info"
      />
      
      <Card title="Título Principal">
        <Section title="Seção" description="Descrição">
          {/* Conteúdo */}
        </Section>
      </Card>
    </div>
  );
}
```

## 📏 Tamanhos de Fonte Recomendados
- **Títulos principais**: text-3xl or text-4xl
- **Subtítulos**: text-lg or text-xl
- **Corpo de texto**: text-base or text-lg
- **Labels**: text-base or text-sm
- **Textos pequenos**: text-sm (nunca text-xs)

## 🎨 Paleta de Cores
- **Primário**: Blue-600 (#2563EB)
- **Sucesso**: Green-200/Green-900 (badges)
- **Aviso**: Yellow-200/Yellow-900 (badges)
- **Perigo**: Red-200/Red-900 (badges)
- **Fundo**: White (#FFFFFF)
- **Texto primário**: Slate-900 (#0F172A)
- **Texto secundário**: Slate-600 (#475569)

## 🔧 Variáveis Tailwind
```
Button sizes: sm (10px), md (12px), lg (14px), icon (12px)
Input height: h-12
Modal padding: p-8
Card padding: p-6
Spacing: gap-4, space-y-6
Borders: border-2
Border radius: rounded-lg, rounded-xl
```

## ✨ Dicas para Manter a Acessibilidade
1. Sempre teste com usuários reais
2. Mantenha textos simples e diretos
3. Use ícones com labels, nunca apenas ícones
4. Teste navegação por teclado
5. Valide formulários com mensagens claras
6. Adicione feedback visual para todas as ações
7. Mantenha consistência de design
8. Use loading states para ações assincronas
