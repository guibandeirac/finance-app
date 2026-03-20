# Brief — Fluxo Caixa

## O que é

App web pessoal de controle financeiro diário. Substitui uma planilha Excel mantida há mais de um ano para acompanhar entradas, saídas e saldo dia a dia.

## Por que existe

A planilha funciona, mas tem limitações que o app resolve:

1. **Sem categorização** — o dinheiro sai mas não se sabe para onde
2. **Sem visão consolidada** — sem gráficos, sem comparativos, sem tendências
3. **Ruim no celular** — planilha horizontal com 12 meses lado a lado não funciona no mobile
4. **Sem controle de cartões** — parcelas e fixos do cartão não são rastreados individualmente

## Para quem

Um único usuário (o próprio desenvolvedor). Brasileiro, usa no dia a dia pelo celular e computador igualmente.

## O que preservar da planilha

- **Running balance diário**: saldo acumulado dia a dia — é a view mais importante do app
- **Planejamento futuro**: pré-cadastrar transações que já sabe que vão acontecer e ver o saldo projetado

## O que o app adiciona

- **Categorização**: cada gasto tem uma categoria (alimentação, transporte, lazer, etc.)
- **Gastos recorrentes com data flexível**: cadastra uma vez com dia estimado, ajusta por mês sem afetar outros (mesada dia ~2, salário dia ~5, etc.)
- **Cartões de crédito**: cadastra cartão → adiciona fixos (Spotify, Claro, academia) + parcelas (notebook 10x) → fatura consolidada vira saída no vencimento
- **Dashboard com gráficos**: evolução do saldo, gastos por categoria, comparativo mensal

## Referência visual

Dashboard do **Dappr**: clean, arejado, números grandes e confiantes, fundo azul-acinzentado suave, cards brancos com bordas sutis, bastante whitespace, ícones em círculos. Fonte geométrica arredondada para números hero.

## Stack

- Next.js 14+ (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + Auth + RLS)
- Recharts para gráficos
- Tipografia: Outfit (headings/números) + JetBrains Mono (valores monetários inline)
- Deploy na Vercel

## Escopo MVP

1. CRUD de transações (entrada, saída, diário)
2. Running balance diário com visualização mensal
3. Gastos recorrentes com data flexível (dia estimado, ajustável por mês)
4. Cartões de crédito com itens fixos + parcelas e fatura consolidada
5. Categorias com ícones e cores
6. Dashboard com gráficos
7. Auth com Supabase

## Fora do escopo (v1)

- Importação de dados da planilha
- Metas financeiras
- Notificações
- Export de dados
- Multi-idioma
- PWA / offline
