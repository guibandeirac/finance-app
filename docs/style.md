# Style Guide — Fluxo Caixa

## Direção Estética

**Referência visual**: Dashboard do Dappr — clean, arejado, com números grandes e confiantes, fundo suavemente colorido, cards com bordas sutis e bastante whitespace. A interface transmite organização e controle sem parecer um app bancário corporativo genérico.

**Tom**: Ferramenta pessoal que inspira confiança. Números são protagonistas — grandes, legíveis, com peso visual forte. Layout limpo com densidade controlada.

## Tipografia

Baseada na estética do Dappr: fonte geométrica, arredondada, com excelente legibilidade em números grandes.

- **Headings e UI**: `"Outfit"` (Google Fonts) — geométrica, arredondada, moderna, ótima em tamanhos grandes. Pesos: 400 (regular), 500 (medium), 600 (semibold para números hero)
- **Valores monetários**: `"JetBrains Mono"` (Google Fonts) — monospace para alinhamento perfeito em tabelas e listas financeiras. Pesos: 400, 500
- **Body text**: `"Outfit"` weight 400
- **Fallback**: `system-ui, -apple-system, sans-serif`

### Escala tipográfica
- Número hero (saldo principal, card destaque): 32-40px, Outfit 600
- Número grande (cards de resumo): 24-28px, Outfit 600
- Número inline (running balance, transações): 15-16px, JetBrains Mono 500
- Heading de página: 24px, Outfit 500
- Heading de seção: 16-18px, Outfit 500
- Body text: 14px, Outfit 400
- Label/caption: 12px, Outfit 400, uppercase, letter-spacing 0.5px
- Meta text: 12-13px, Outfit 400

## Paleta de Cores

### Light Mode
```css
--background: #F0F4F8;         /* azul-acinzentado suave, como o Dappr */
--surface: #FFFFFF;             /* cards e containers */
--surface-hover: #F5F7FA;
--border: #E2E8F0;
--text-primary: #0F172A;       /* slate-900 */
--text-secondary: #64748B;     /* slate-500 */
--text-muted: #94A3B8;         /* slate-400 */
```

### Dark Mode
```css
--background: #0B1120;         /* slate deep */
--surface: #1E293B;            /* slate-800 */
--surface-hover: #334155;      /* slate-700 */
--border: #334155;
--text-primary: #F1F5F9;       /* slate-100 */
--text-secondary: #94A3B8;     /* slate-400 */
--text-muted: #64748B;         /* slate-500 */
```

### Cores Semânticas (ambos os temas)
```css
--positive: #16A34A;           /* green-600, entradas */
--positive-bg: #DCFCE7;        /* green-100, badge entrada light */
--positive-bg-dark: #14532D;   /* green-900, badge entrada dark */

--negative: #DC2626;           /* red-600, saídas e saldo negativo */
--negative-bg: #FEE2E2;        /* red-100, badge saída light */
--negative-bg-dark: #7F1D1D;   /* red-900, badge saída dark */

--daily: #F59E0B;              /* amber-500, gastos diários */
--daily-bg: #FEF3C7;           /* amber-100, badge diário light */
--daily-bg-dark: #78350F;      /* amber-900, badge diário dark */

--accent: #2563EB;             /* blue-600, ações primárias, links */
--accent-hover: #1D4ED8;       /* blue-700 */

--card-bill: #7C3AED;          /* violet-600, faturas de cartão */
--card-bill-bg: #EDE9FE;       /* violet-100, badge fatura light */
--card-bill-bg-dark: #4C1D95;  /* violet-900, badge fatura dark */
```

### Cores das Categorias
```css
--cat-alimentacao: #F97316;    /* orange-500 */
--cat-transporte: #6366F1;     /* indigo-500 */
--cat-moradia: #8B5CF6;        /* violet-500 */
--cat-saude: #EC4899;          /* pink-500 */
--cat-lazer: #14B8A6;          /* teal-500 */
--cat-educacao: #3B82F6;       /* blue-500 */
--cat-assinaturas: #A855F7;    /* purple-500 */
--cat-salario: #22C55E;        /* green-500 */
--cat-freelance: #10B981;      /* emerald-500 */
--cat-outros: #64748B;         /* slate-500 */
```

## Layout

### Estrutura Principal
- **Sidebar** (desktop): navegação lateral colapsável, ícones à esquerda com labels. Fundo transparent/surface, ícones com 24px, items com 44px de altura mínima para touch targets
- **Bottom nav** (mobile): 5 itens — Saldo, Dashboard, Cartões, Recorrentes, Config
- **Content area**: max-width 960px para conteúdo tabular, full-width para dashboard com grid

### Espaçamento
- Base unit: 4px
- Padding de cards: 16px (mobile) / 20px (desktop)
- Gap entre cards: 12px (mobile) / 16px (desktop)
- Margin lateral: 16px (mobile) / 32px (desktop)

### Breakpoints
```css
--mobile: 0px - 639px
--tablet: 640px - 1023px
--desktop: 1024px+
```

## Componentes-Chave

### Summary Cards (estilo Dappr)
- Grid de 4 cards no topo
- Cada card: ícone em círculo (40px) no canto, label muted em cima, número hero embaixo (24-28px, Outfit 600), variação % em badge
- Background: --surface, border sutil, border-radius 12px
- Sem sombras — flat design

### Card de Transação
- Altura compacta (~56px)
- Layout: `[dot cor da categoria] [descrição + nome da categoria] [valor alinhado à direita]`
- Valor em verde (entrada), vermelho (saída), âmbar (diário)
- Monospace no valor (JetBrains Mono)
- Badge "Recorrente" ou "Fatura PicPay" quando aplicável

### Running Balance Row
- Data à esquerda (dia + dia da semana), saldo à direita (JetBrains Mono)
- Tags coloridas inline mostrando as transações do dia (+500, -120, -35)
- Saldo negativo em vermelho com background sutil
- Dia atual com borda accent à esquerda
- Dias futuros com opacidade 0.55 e saldo com borda tracejada

### Card de Cartão de Crédito
- Header: nome do cartão + ícone/cor + dia de vencimento
- Fatura total em destaque (número grande, violet)
- Lista de itens: fixos com badge "Fixo" + parcelas com badge "3/10"
- Botão de adicionar item (fixo ou parcela)

### FAB (Floating Action Button)
- Botão "+" para nova transação, fixo no canto inferior direito (mobile)
- 48px, accent color, sem sombra (flat)
- Desktop: botão no header + atalho Cmd/Ctrl+N

### Modal de Nova Transação
- Sheet bottom (mobile) ou dialog center (desktop)
- Toggle de tipo com 3 botões coloridos (entrada/saída/diário)
- Input de valor grande (JetBrains Mono 20px+)
- Campos: data, categoria, descrição

## Animações

- **Transições de página**: fade + slide sutil (150ms ease-out)
- **Cards entrando**: stagger de 30ms, fade-in + translateY(8px)
- **FAB**: scale on press (0.95)
- **Modais**: backdrop fade + content slide-up (200ms)
- **Toggle de recorrente**: slide suave do thumb (200ms)

## Ícones

- `lucide-react` — limpo, consistente
- Tamanho: 16px inline, 20px em botões, 24px em nav

## Regras Gerais

1. **Números são protagonistas** — grandes, Outfit 600 para destaque, JetBrains Mono para alinhamento
2. **Verde = entrada, Vermelho = saída, Âmbar = diário, Violeta = fatura de cartão** — consistente
3. **Fundo levemente colorido** (azul-acinzentado light, slate-deep dark) — como o Dappr, não branco puro
4. **Cards brancos** sobre fundo colorido — contraste com o background
5. **Densidade controlada** — muita informação mas com whitespace generoso
6. **Mobile não é versão menor** — mesma experiência, reorganizada
7. **Zero jargão financeiro** — linguagem simples, PT-BR coloquial
8. **Flat design** — sem sombras, sem gradientes, bordas sutis
