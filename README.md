# Create It

Rede social sustentável gamificada: cada ação sustentável registrada vira ponto, e os pontos são trocados por recompensas de patrocinadores locais.

Projeto da A3 de Banco de Dados – Universidade Anhembi Morumbi.

## Estrutura

```
create-it/
├── database/   scripts SQL (PostgreSQL 16)
│   ├── 01_schema.sql      tabelas, constraints, índices, trigger, função de resgate e views
│   ├── 02_seed.sql        dados de teste
│   └── 03_seguranca.sql   perfis de acesso (GRANT/REVOKE)
├── backend/    API em Node.js + Express
└── frontend/   app web em React + Vite
```

## Como rodar

Precisa de **Node.js 20+** e **PostgreSQL 16**.

### 1. Banco de dados

```bash
# cria o usuário e o banco (uma vez só)
psql -U postgres -c "CREATE USER createit WITH PASSWORD 'createit';"
psql -U postgres -c "CREATE DATABASE createit OWNER createit;"

# cria as tabelas e coloca os dados de teste
psql -U createit -d createit -f database/01_schema.sql
psql -U createit -d createit -f database/02_seed.sql
```

O `03_seguranca.sql` é opcional no desenvolvimento e roda com o usuário `postgres`.

### 2. Back-end

```bash
cd backend
cp .env.example .env     # ajuste a DATABASE_URL se precisar
npm install
npm run dev              # API em http://localhost:3333
```

### 3. Front-end

```bash
cd frontend
npm install
npm run dev              # app em http://localhost:5173
```

Entre com **demo@createit.com** e a senha **create123** (todos os usuários de teste usam essa senha).

## Onde os conceitos de banco aparecem

| Conceito | Onde |
|---|---|
| Integridade referencial | FKs com `ON DELETE CASCADE / SET NULL` em todas as tabelas |
| Constraints | `CHECK` de saldo nunca negativo, status válidos, datas do desafio, ninguém segue a si mesmo |
| Trigger | `trg_creditar_pontos`: ao validar uma postagem, credita os pontos, atualiza o nível e libera conquistas |
| Transação | `fn_resgatar`: trava saldo e estoque (`FOR UPDATE`), debita, baixa estoque e gera o voucher de uma vez |
| Views | `vw_feed`, `vw_ranking`, `vw_impacto_categoria` |
| Índices | feed por usuário/data, curtidas, comentários, ranking por pontos |
| Segurança | papéis `papel_app`, `papel_relatorio`, `papel_admin` com GRANT/REVOKE; senhas com bcrypt |

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
"# Createit" 
