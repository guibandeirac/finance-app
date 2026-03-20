# PRD — Fluxo Caixa (Personal Finance Tracker)

## Visão Geral

Web app pessoal de controle financeiro diário que substitui uma planilha Excel usada há mais de um ano. O sistema deve manter o modelo mental do usuário — **running balance diário com planejamento futuro** — mas resolver as limitações da planilha: falta de categorização, ausência de visão consolidada/gráficos e dificuldade de uso no celular.

## Problema

O usuário controla suas finanças pessoais numa planilha Excel com abas por ano, meses lado a lado, e colunas de DATA, ENTRADA, SAÍDA 1-3, DIÁRIO e SALDO. O sistema funciona, mas:

1. **Sem categorização** — gastos não são classificados, impossibilitando entender para onde vai o dinheiro
2. **Sem visão consolidada** — não há gráficos, totais mensais comparativos, ou tendências
3. **Trabalhoso no celular** — Excel mobile é péssimo para essa estrutura de planilha horizontal
4. **Gastos recorrentes manuais** — todo mês precisa pré-preencher os mesmos valores fixos
5. **Sem controle de faturas de cartão** — parcelas e gastos fixos do cartão não são rastreados individualmente

## Público

Uso pessoal exclusivo (single-user). O usuário é um desenvolvedor brasileiro, 100% em português.

## Conceitos-Chave

### Running Balance (Saldo Diário)
O saldo é calculado dia a dia: `saldo_anterior + entradas - saídas - diário`. Isso é o coração do sistema e **deve ser a view principal**.

### Tipos de Transação
- **ENTRADA** — dinheiro que entra (salário, freelance, pix recebido, etc.)
- **SAÍDA** — contas programadas/obrigatórias (boletos, fatura do cartão, plano de saúde, etc.)
- **DIÁRIO** — gastos variáveis do dia-a-dia (alimentação, transporte, lazer, compras avulsas)

### Planejamento Futuro
O usuário pré-cadastra transações futuras que já sabe que vão acontecer. O saldo futuro é projetado com base nesses lançamentos.

### Recorrentes com Data Flexível
Gastos e receitas recorrentes têm um **dia estimado** (ex: "mesada ~dia 2"). O sistema gera a transação nesse dia, mas o usuário pode ajustar o dia real a cada mês sem alterar meses anteriores nem a recorrência original. Exemplos:
- "Mesada" dia estimado 2 → em março caiu dia 3 (era domingo). Move só a de março; abril volta a ser dia 2.
- "Salário" dia estimado 5 → em meses com feriado pode cair no 4 ou 6.
- Vencimento de cartão dia 10 → em feriado pode virar 11.

### Faturas de Cartão de Crédito
Cartões de crédito (PicPay, Nubank, etc.) possuem:
- **Itens fixos**: gastos que repetem todo mês (Claro, academia, Spotify, Cloudflare)
- **Parcelas**: compras parceladas (ex: "Notebook 10x R$150", parcela 3/10)
- A fatura mensal = soma dos fixos + parcelas ativas naquele mês
- A fatura gera automaticamente uma transação de SAÍDA no dia de vencimento do cartão
- Parcelas encerradas saem automaticamente da fatura do mês seguinte

## Funcionalidades

### MVP (v1)

#### F1 — Lançamento de Transações
- Criar transação com: data, valor, tipo (entrada/saída/diário), categoria, descrição (opcional)
- Editar e excluir transações
- Interface rápida para lançar — mínimo de cliques/taps
- Suporte a múltiplas transações no mesmo dia

#### F2 — Running Balance (Saldo Diário)
- View principal mostrando lista de dias com saldo acumulado
- Visualização mês a mês
- Saldo atualiza automaticamente ao adicionar/editar/remover transações
- Destaque visual quando saldo fica negativo
- Dias futuros com projeção visual diferenciada (opacidade, tracejado)

#### F3 — Gastos Recorrentes (data flexível)
- Cadastrar transação recorrente: valor, tipo, categoria, dia estimado, descrição
- Dia estimado é sugestão — usuário ajusta o dia real por mês sem afetar outros meses
- Recorrências geram automaticamente os lançamentos futuros
- Pausar, editar ou cancelar recorrência
- Ao editar recorrência master: "Alterar a partir de agora ou também futuras já geradas?"

#### F4 — Cartões de Crédito
- Cadastrar cartão: nome, dia de vencimento, cor
- Itens fixos do cartão: valor, descrição, categoria (recorrente mensal)
- Parcelas do cartão: valor da parcela, total de parcelas, parcela atual, descrição, categoria
- Fatura mensal calculada automaticamente (fixos + parcelas ativas)
- Fatura gera transação de SAÍDA no dia do vencimento
- Expandir fatura no running balance mostra breakdown dos itens
- Tela de gestão do cartão: ver/adicionar/editar/remover itens

#### F5 — Categorização
- Categorias pré-definidas: Alimentação, Transporte, Moradia, Saúde, Lazer, Educação, Assinaturas, Salário, Freelance, Outros
- Categorias customizadas
- Cada categoria com ícone e cor
- Toda transação deve ter uma categoria

#### F6 — Dashboard
- Resumo do mês: total entradas, total saídas, total diário, saldo final
- Gráfico de evolução do saldo (line chart)
- Gráfico de gastos por categoria (donut chart)
- Comparativo últimos 3 meses (bar chart)

#### F7 — Autenticação
- Login com Supabase Auth (email/senha ou magic link)
- Single-user com auth para proteger dados
- RLS no Supabase

### Pós-MVP (v2+)

- Importação de dados históricos da planilha Excel
- Metas financeiras
- Notificações/lembretes
- Busca e filtros avançados
- Export de dados (CSV/PDF)
- Visão anual consolidada

## Stack Técnica

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend/DB**: Supabase (PostgreSQL + Auth + RLS)
- **Gráficos**: Recharts
- **Deploy**: Vercel
- **Tema**: Dark/Light mode seguindo preferência do sistema, com toggle manual

## Requisitos Não-Funcionais

- **Responsivo**: funcionar igualmente bem em mobile e desktop
- **Performance**: carregamento < 2s, transições suaves
- **Idioma**: 100% em português brasileiro
- **Acessibilidade**: contraste adequado, navegação por teclado

## Schema do Banco (Supabase)

### Tabela `profiles`
- `id` (uuid, FK auth.users)
- `name` (text)
- `created_at` (timestamptz)

### Tabela `categories`
- `id` (uuid, PK)
- `user_id` (uuid, FK profiles)
- `name` (text)
- `type` (enum: 'entrada' | 'saida' | 'diario' | 'all')
- `icon` (text)
- `color` (text, hex)
- `is_default` (boolean)
- `created_at` (timestamptz)

### Tabela `credit_cards`
- `id` (uuid, PK)
- `user_id` (uuid, FK profiles)
- `name` (text) — ex: "PicPay", "Nubank"
- `due_day` (integer, 1-31) — dia de vencimento da fatura
- `color` (text, hex)
- `icon` (text, nullable)
- `is_active` (boolean, default true)
- `created_at` (timestamptz)

### Tabela `credit_card_items`
- `id` (uuid, PK)
- `card_id` (uuid, FK credit_cards)
- `user_id` (uuid, FK profiles)
- `item_type` (enum: 'fixed' | 'installment')
- `description` (text) — ex: "Spotify", "Notebook Dell"
- `category_id` (uuid, FK categories)
- `amount` (numeric) — valor mensal (fixo) ou valor da parcela
- `total_installments` (integer, nullable) — só para parcelas
- `current_installment` (integer, nullable) — só para parcelas
- `start_date` (date)
- `end_date` (date, nullable) — fixos: null; parcelas: calculado
- `is_active` (boolean, default true)
- `created_at` (timestamptz)

### Tabela `transactions`
- `id` (uuid, PK)
- `user_id` (uuid, FK profiles)
- `date` (date)
- `amount` (numeric)
- `type` (enum: 'entrada' | 'saida' | 'diario')
- `category_id` (uuid, FK categories)
- `description` (text, nullable)
- `recurring_id` (uuid, FK recurring_transactions, nullable)
- `credit_card_id` (uuid, FK credit_cards, nullable) — se for fatura de cartão
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### Tabela `recurring_transactions`
- `id` (uuid, PK)
- `user_id` (uuid, FK profiles)
- `amount` (numeric)
- `type` (enum: 'entrada' | 'saida' | 'diario')
- `category_id` (uuid, FK categories)
- `description` (text)
- `estimated_day` (integer, 1-31) — dia ESTIMADO, ajustável por mês
- `start_date` (date)
- `end_date` (date, nullable)
- `is_active` (boolean)
- `created_at` (timestamptz)

**Nota sobre data flexível**: quando o sistema gera uma transação a partir de uma recorrência, usa o `estimated_day` como default. O usuário pode mover a transação gerada para outro dia daquele mês (editando a `date` da transaction). Isso NÃO altera o `estimated_day` da recorrência nem afeta outros meses.

### Views / RPC
- `daily_balance(user_id, year, month)` — running balance por dia
- `monthly_summary(user_id, year, month)` — totais por tipo e categoria
- `generate_recurring_transactions(user_id, year, month)` — gera transações de recorrências (idempotente)
- `generate_card_bills(user_id, year, month)` — gera transações de fatura consolidada por cartão (idempotente)
- `get_card_bill_breakdown(card_id, year, month)` — retorna itens individuais da fatura

### RLS Policies
- Todas as tabelas: `user_id = auth.uid()` em SELECT, INSERT, UPDATE, DELETE

## Métricas de Sucesso

1. Lançar transação em < 10 segundos
2. Running balance sem erros de arredondamento
3. Dashboard carrega em < 1 segundo
4. Abandono da planilha em até 2 semanas
