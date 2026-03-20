# Tasks — Fluxo Caixa

## Fase 0: Setup do Projeto

- [ ] **T0.1** — Criar projeto Next.js 14+ com App Router, TypeScript, Tailwind CSS
- [ ] **T0.2** — Instalar e configurar shadcn/ui (button, input, select, dialog, sheet, dropdown-menu, popover, calendar, badge, card, tabs, toast, separator, avatar, toggle, switch)
- [ ] **T0.3** — Instalar dependências: `recharts`, `lucide-react`, `date-fns` (com locale pt-BR), `@supabase/supabase-js`, `@supabase/ssr`, `next-themes`
- [ ] **T0.4** — Configurar Supabase client (env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [ ] **T0.5** — Configurar tema dark/light com `next-themes` — seguir preferência do sistema com toggle manual
- [ ] **T0.6** — Configurar fontes: Outfit (Google Fonts, weights 400/500/600) + JetBrains Mono (Google Fonts, weights 400/500)
- [ ] **T0.7** — Criar layout base: sidebar (desktop) + bottom nav (mobile) + content area responsiva. Sidebar com itens: Saldo diário, Dashboard, Cartões, Recorrentes, Categorias, Configurações
- [ ] **T0.8** — Configurar CSS variables conforme style.md: background #F0F4F8 (light) / #0B1120 (dark), surfaces brancas, cores semânticas (green/red/amber/violet), cores de categorias

## Fase 1: Banco de Dados (Supabase)

- [ ] **T1.1** — Criar migration SQL com as tabelas: `profiles`, `categories`, `credit_cards`, `credit_card_items`, `transactions`, `recurring_transactions`
  - Tipos enum: `transaction_type` ('entrada', 'saida', 'diario'), `card_item_type` ('fixed', 'installment')
  - PKs uuid com `gen_random_uuid()`
  - Indexes: `transactions(user_id, date)`, `transactions(category_id)`, `transactions(credit_card_id)`, `recurring_transactions(user_id, is_active)`, `credit_card_items(card_id, is_active)`
- [ ] **T1.2** — Criar RLS policies para todas as tabelas: `user_id = auth.uid()`
- [ ] **T1.3** — Criar trigger `handle_new_user` para auto-criar profile no signup
- [ ] **T1.4** — Criar seed de categorias default (10 categorias com ícones e cores do style.md) — via trigger no signup
- [ ] **T1.5** — Criar function RPC `get_daily_balance(p_user_id uuid, p_year int, p_month int)` — retorna: date, entries_total, exits_total, daily_total, balance para cada dia do mês, com running balance acumulado incluindo saldo do mês anterior
- [ ] **T1.6** — Criar function RPC `get_monthly_summary(p_user_id uuid, p_year int, p_month int)` — totais por tipo e por categoria, saldo inicial e final
- [ ] **T1.7** — Criar function RPC `generate_recurring_transactions(p_user_id uuid, p_year int, p_month int)` — gera transações a partir das recorrências ativas usando `estimated_day`. Idempotente (não duplica). Transações geradas mantêm `recurring_id` como referência
- [ ] **T1.8** — Criar function RPC `generate_card_bills(p_user_id uuid, p_year int, p_month int)` — para cada cartão ativo, soma fixos ativos + parcelas ativas no mês, cria transação de SAÍDA no `due_day` com `credit_card_id`. Idempotente. Parcelas com `current_installment >= total_installments` são ignoradas
- [ ] **T1.9** — Criar function RPC `get_card_bill_breakdown(p_card_id uuid, p_year int, p_month int)` — retorna itens individuais da fatura (fixos + parcelas ativas) com descrição, valor, categoria, e para parcelas: "parcela X/Y"

## Fase 2: Autenticação

- [ ] **T2.1** — Criar página `/login` com formulário email + senha e opção magic link. Estilo clean com fundo --background, card centralizado
- [ ] **T2.2** — Criar página `/signup` com formulário de cadastro
- [ ] **T2.3** — Middleware Next.js para proteger rotas (redirect para /login se não autenticado)
- [ ] **T2.4** — Header com avatar/iniciais, nome do usuário, toggle dark/light, botão logout
- [ ] **T2.5** — Callback de auth (`/auth/callback`) para magic link

## Fase 3: Categorias

- [ ] **T3.1** — Página `/categorias` com listagem de todas as categorias
- [ ] **T3.2** — Card de categoria: dot de cor, ícone (lucide), nome, badge tipo
- [ ] **T3.3** — Dialog criar categoria: nome, tipo, seletor de ícone (grid lucide), seletor de cor (palette fixa ~12 cores)
- [ ] **T3.4** — Edição e exclusão (bloquear exclusão se tem transações vinculadas)

## Fase 4: Transações (CRUD)

- [ ] **T4.1** — Componente `TransactionForm` (sheet bottom mobile / dialog desktop): data (calendar picker), valor (input JetBrains Mono 20px, máscara R$), tipo (toggle 3 botões coloridos), categoria (select filtrado por tipo), descrição (opcional)
- [ ] **T4.2** — FAB "+" mobile (48px, accent, canto inferior direito). Desktop: botão no header + atalho Cmd/Ctrl+N
- [ ] **T4.3** — Componente `TransactionCard` (56px): dot categoria, descrição, nome categoria, valor colorido (monospace), badge "Recorrente" ou "Fatura NomeCartão" quando aplicável
- [ ] **T4.4** — Listagem por dia: agrupar por data, transações do dia + subtotais
- [ ] **T4.5** — Edição: tap/click abre form preenchido
- [ ] **T4.6** — Exclusão: swipe left mobile / menu contexto, confirmação
- [ ] **T4.7** — Validações: valor > 0, data obrigatória, categoria obrigatória

## Fase 5: Running Balance (View Principal)

- [ ] **T5.1** — Página `/` (home) com running balance do mês atual
- [ ] **T5.2** — `MonthSelector`: navegação ← Março 2026 → com setas
- [ ] **T5.3** — `DailyBalanceRow`: data (dia + dia semana), tags coloridas inline (+500, -120, -35), saldo à direita (JetBrains Mono). Dia atual: borda accent. Futuros: opacidade 0.55, saldo tracejado. Negativo: vermelho + bg sutil
- [ ] **T5.4** — Lista de DailyBalanceRow chamando RPC `get_daily_balance`
- [ ] **T5.5** — Expandir dia: mostrar TransactionCards + botão adicionar. Para faturas de cartão: expandir mostra breakdown dos itens
- [ ] **T5.6** — Header do mês com summary cards (4 cards estilo Dappr): Entradas, Saídas, Diário, Saldo — com variação % vs mês anterior
- [ ] **T5.7** — Ao acessar mês, chamar `generate_recurring_transactions` + `generate_card_bills`
- [ ] **T5.8** — Transações de recorrência: usuário pode mover para outro dia do mês (editar date) sem afetar recorrência original nem outros meses

## Fase 6: Cartões de Crédito

- [ ] **T6.1** — Página `/cartoes` com listagem dos cartões
- [ ] **T6.2** — Card de cartão: nome, cor, dia vencimento, fatura do mês atual (valor grande em violet), quantidade de itens ativos
- [ ] **T6.3** — Página de detalhe do cartão `/cartoes/[id]`: header com nome + fatura total + dia vencimento. Seção "Fixos" com lista de itens fixos. Seção "Parcelas" com lista de parcelas (mostrando "parcela X/Y"). Botão adicionar item
- [ ] **T6.4** — Dialog adicionar item fixo: descrição, valor, categoria
- [ ] **T6.5** — Dialog adicionar parcela: descrição, valor da parcela, total de parcelas, parcela inicial (default 1), categoria
- [ ] **T6.6** — Edição e exclusão de itens (fixos e parcelas)
- [ ] **T6.7** — Toggle ativar/desativar item (sem deletar)
- [ ] **T6.8** — Dialog adicionar novo cartão: nome, dia de vencimento, cor
- [ ] **T6.9** — Parcelas auto-incrementam: a cada mês que `generate_card_bills` roda, `current_installment` incrementa. Quando `current_installment > total_installments`, item é desativado

## Fase 7: Gastos Recorrentes

- [ ] **T7.1** — Página `/recorrentes` com listagem (ativas e pausadas)
- [ ] **T7.2** — `RecurringCard`: ícone em círculo (cor por tipo), descrição, valor, "~dia X" (indicando dia estimado), badge ativo/pausado
- [ ] **T7.3** — Dialog criar recorrência: valor, tipo, categoria, descrição, dia estimado (1-31), data início, data fim (opcional)
- [ ] **T7.4** — Toggle ativar/desativar recorrência
- [ ] **T7.5** — Edição e exclusão. Ao editar: "Alterar a partir de agora ou também transações futuras já geradas?"
- [ ] **T7.6** — Indicador visual no running balance: transações geradas por recorrência têm badge "Recorrente" e podem ser movidas de dia individualmente

## Fase 8: Dashboard

- [ ] **T8.1** — Página `/dashboard`
- [ ] **T8.2** — Summary cards (grid 2x2 mobile / 4 colunas desktop): Total Entradas, Total Saídas, Total Diário, Saldo Final — cada um com ícone em círculo (estilo Dappr) e variação % vs mês anterior
- [ ] **T8.3** — Line chart evolução do saldo (Recharts): eixo X = dias, eixo Y = saldo. Linha sólida passado, tracejada projeção. Cor: accent
- [ ] **T8.4** — Donut chart gastos por categoria: top 5 + "Outros", cores do style.md, legenda com valores
- [ ] **T8.5** — Bar chart comparativo últimos 3 meses: entradas vs saídas vs diário
- [ ] **T8.6** — MonthSelector no dashboard
- [ ] **T8.7** — Loading skeletons para gráficos

## Fase 9: Polish & UX

- [ ] **T9.1** — Empty states para todas as views (ilustração simples + CTA)
- [ ] **T9.2** — Loading states: skeletons para listas, spinner para ações
- [ ] **T9.3** — Toast notifications (criado/editado/excluído, erros)
- [ ] **T9.4** — Confirmação de ações destrutivas
- [ ] **T9.5** — Keyboard shortcuts (desktop): Cmd+N (nova transação), Cmd+← / Cmd+→ (mês)
- [ ] **T9.6** — Página `/config`: toggle dark/light, gerenciar conta
- [ ] **T9.7** — Responsividade: testar 375px, 390px, 768px, 1024px+
- [ ] **T9.8** — Meta tags, favicon, título "Fluxo Caixa"
- [ ] **T9.9** — Error boundaries, fallback UI, retry em falhas de rede

## Ordem de Execução

1. **Fase 0** (setup) → 2. **Fase 1** (banco) → 3. **Fase 2** (auth) → 4. **Fase 3** (categorias) → 5. **Fase 4** (transações) → 6. **Fase 5** (running balance) → 7. **Fase 6** (cartões) → 8. **Fase 7** (recorrentes) → 9. **Fase 8** (dashboard) → 10. **Fase 9** (polish)

Fases são sequenciais. Tasks dentro de cada fase podem ser feitas em paralelo quando não há dependência direta.
