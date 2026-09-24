# Create It

Rede social sustentável gamificada: cada ação sustentável registrada vira ponto, e os pontos são trocados por recompensas de patrocinadores locais.

Projeto da A3 de Banco de Dados – Universidade Anhembi Morumbi.

## Estrutura

```
create-it/
├── database/   scripts SQL (PostgreSQL 16 / Supabase)
│   ├── 01_schema.sql      tabelas, constraints, índices, trigger, função de resgate e views
│   ├── 02_seed.sql        dados de teste
│   └── 03_seguranca.sql   perfis de acesso (GRANT/REVOKE)
├── backend/    API em Node.js + Express
└── frontend/   app web em React + Vite
```

## Como rodar

Precisa de **Node.js 20+** e de um projeto no **Supabase** (plano gratuito serve).

### 1. Banco de dados no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) e anote a senha do banco.
2. Abra o **SQL Editor** e rode os scripts, um de cada vez, nesta ordem:
   - `database/01_schema.sql`: cria as tabelas, o trigger, a função de resgate e as views
   - `database/02_seed.sql`: coloca os dados de teste
   - `database/03_seguranca.sql`: cria os perfis de acesso. **Antes de rodar, troque as senhas** de `app_createit` e `relatorio_createit`.
3. Em **Project Settings > Database > Connection string**, copie a URI do **Session pooler**.

As tabelas ficam no schema `createit`, e não no `public`. Isso é de propósito: o Supabase expõe o `public` na API REST dele, e aqui a API é o nosso back-end. O `03_seguranca.sql` ainda tira qualquer acesso dos papéis `anon` e `authenticated` do Supabase ao schema.

### 2. Back-end

```bash
cd backend
cp .env.example .env
npm install
npm run dev              # API em http://localhost:3333
```

No `.env`, cole a URI do Session pooler trocando o usuário `postgres` por `app_createit` e a senha pela que você definiu no `03_seguranca.sql`:

```
DATABASE_URL=postgresql://app_createit.<id-do-projeto>:<senha>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

A API conecta com esse usuário, que só pode ler e gravar dados (não consegue apagar tabelas, mexer nas categorias nem apagar resgates).

> Se o pooler recusar o usuário `app_createit`, dá para conectar com o `postgres` mesmo: rode `ALTER ROLE postgres SET search_path = createit, public, extensions;` no SQL Editor e use a URI original.

### 3. Front-end

```bash
cd frontend
npm install
npm run dev              # app em http://localhost:5173
```

Entre com **demo@createit.com** e a senha **create123** (todos os usuários de teste usam essa senha).

### Rodando com Postgres local (opcional)

Os mesmos scripts funcionam num PostgreSQL 16 instalado na máquina. Crie um banco `createit`, rode os três scripts com o usuário `postgres` e use `DATABASE_URL=postgres://app_createit:<senha>@localhost:5432/createit`.

## Onde os conceitos de banco aparecem

| Conceito | Onde |
|---|---|
| Integridade referencial | FKs com `ON DELETE CASCADE / SET NULL` em todas as tabelas |
| Constraints | `CHECK` de saldo nunca negativo, status válidos, datas do desafio, ninguém segue a si mesmo |
| Trigger | `trg_creditar_pontos`: ao validar uma postagem, credita os pontos, atualiza o nível e libera conquistas |
| Transação | `fn_resgatar`: trava saldo e estoque (`FOR UPDATE`), debita, baixa estoque e gera o voucher de uma vez |
| Views | `vw_feed`, `vw_ranking`, `vw_impacto_categoria` |
| Índices | feed por usuário/data, curtidas, comentários, ranking por pontos |
| Segurança | papéis `papel_app`, `papel_relatorio`, `papel_admin` com GRANT/REVOKE; API conecta com usuário restrito; senhas com bcrypt |
| Hospedagem | Supabase (PostgreSQL gerenciado, com backup diário automático) |

## Rotas da API

| Método | Rota | O que faz |
|---|---|---|
| POST | `/api/auth/cadastro` | cria conta |
| POST | `/api/auth/login` | entra e devolve o token |
| GET | `/api/auth/eu` | dados do usuário logado |
| GET | `/api/postagens/feed?filtro=seguindo\|alta` | feed |
| POST | `/api/postagens` | registra uma ação (ganha pontos) |
| POST | `/api/postagens/:id/curtir` | curte ou descurte |
| POST | `/api/postagens/:id/comentarios` | comenta |
| GET | `/api/categorias` | categorias de ação |
| GET | `/api/desafios` | desafios ativos com o progresso do usuário |
| GET | `/api/recompensas` | recompensas disponíveis |
| POST | `/api/recompensas/:id/resgatar` | troca pontos por recompensa |
| GET | `/api/resgates` | vouchers do usuário |
| GET | `/api/ranking` | top 10 |
| GET | `/api/busca?q=` | busca pessoas, ações e recompensas |
| GET | `/api/usuarios/:id` | perfil completo |
| POST | `/api/usuarios/:id/seguir` | segue ou deixa de seguir |

## O que ainda falta

- Upload de foto nas ações
- Validação das ações por moderador (hoje é automática)
- Comentários na tela (a API já tem)
- Editar perfil
