# Create It

Rede social sustentável gamificada: cada ação sustentável registrada vira ponto, e os pontos são trocados por recompensas de patrocinadores locais.

Projeto da A3 de Banco de Dados – Universidade Anhembi Morumbi.

## Estrutura

```
create-it/
├── database/   scripts SQL (PostgreSQL 16 / Supabase)
│   ├── 01_schema.sql      tabelas, constraints, índices, trigger, função de resgate e views
│   ├── 02_seed.sql        dados de teste
│   ├── 03_seguranca.sql   perfis de acesso (GRANT/REVOKE)
│   ├── 04_storage.sql     bucket de fotos no Supabase Storage
│   ├── 05_apagar_postagem.sql  trigger que estorna pontos e conquistas ao apagar uma postagem
│   ├── 06_tempo_real.sql  triggers que avisam o site e o app em tempo real (Supabase Realtime)
│   └── 07_admin.sql       administradores (moderação pelo site e pelo app)
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
   - `database/04_storage.sql`: cria o bucket `fotos` no Supabase Storage (fotos das ações)
   - `database/05_apagar_postagem.sql`: trigger que desfaz pontos e conquistas quando uma postagem é apagada. Não apaga dados, então dá para rodar num banco que já está em uso.
   - `database/06_tempo_real.sql`: triggers que avisam o site e o app quando entra postagem, curtida ou comentário (veja **Tempo real** abaixo). Também não apaga dados.
   - `database/07_admin.sql`: cria a coluna `admin` dos usuários (veja **Administradores** abaixo). Também não apaga dados.
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

Para aceitar fotos nas ações, preencha também `SUPABASE_URL` (Project Settings > Data API) e `SUPABASE_SECRET_KEY` (Project Settings > API Keys > Secret key). A foto passa pelo back-end, que confere se é mesmo JPG, PNG ou WEBP de até 5 MB e envia ao bucket com essa chave. Ela nunca vai para o front-end. Sem essas variáveis o app funciona normalmente, só recusa foto.

> Se o pooler recusar o usuário `app_createit`, dá para conectar com o `postgres` mesmo: rode `ALTER ROLE postgres SET search_path = createit, public, extensions;` no SQL Editor e use a URI original.

### 3. Front-end

```bash
cd frontend
npm install
npm run dev              # app em http://localhost:5173
```

Para o feed se atualizar sozinho, copie `frontend/.env.example` para `frontend/.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Na Vercel, cadastre as duas em **Settings > Environment Variables**.

Entre com **demo@createit.com** e a senha **create123** (todos os usuários de teste usam essa senha).

### 4. App mobile (Android / iOS)

O app usa **a mesma API** do site, e por isso o mesmo banco: ele nunca conecta direto no Postgres nem guarda credencial do Supabase (a chave publishable do tempo real é pública e não dá acesso ao banco). Login, pontos, postagens, fotos e resgates são os mesmos nas duas versões.

```bash
cd mobile
npm install
npx expo start           # abre o QR code
```

Instale o **Expo Go** no celular e leia o QR code. Celular e computador precisam estar na mesma rede Wi-Fi.

- **Desenvolvimento:** com o backend rodando (`npm run dev`), o app descobre sozinho o IP do computador e usa `http://<ip>:3333/api`. Se o firewall do Windows perguntar, libere o Node na rede privada.
- **Produção:** copie `mobile/.env.example` para `mobile/.env` e preencha `EXPO_PUBLIC_API_URL=https://<seu-projeto>.vercel.app/api`.
- **Tempo real:** no mesmo `mobile/.env`, preencha `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Depois de mudar o `.env`, reinicie o `npx expo start`.
- **Gerar APK / IPA:** `npx eas-cli@latest build -p android` (ou `-p ios`). Precisa de uma conta gratuita na Expo.

O token de login fica no armazenamento seguro do aparelho (Keychain no iOS, Keystore no Android). As fotos são convertidas para JPEG de até 1600 px antes do envio, então fotos HEIC do iPhone também funcionam.

### Tempo real

Feed, curtidas e comentários se atualizam sozinhos no site e no app:

- **Postagem nova** de quem você segue: aparece o botão "N novas postagens" no topo do feed (aba Seguindo). A lista não pula sozinha enquanto você lê.
- **Curtidas e comentários:** os números mudam na hora em qualquer postagem na tela.
- **Tela de comentários:** comentários de outras pessoas aparecem sem recarregar.
- **Postagem apagada:** some da tela de quem está vendo.

Como funciona: os triggers do `06_tempo_real.sql` chamam `realtime.send` e publicam um aviso no canal `feed` do **Supabase Realtime (Broadcast)**. O aviso só sai depois do COMMIT e leva apenas ids e totais (ex.: `{ id_postagem: 12, curtidas: 5 }`), nunca texto nem dados pessoais. Ao receber, o site e o app buscam o resto **pela API, com login**, como sempre. Ninguém lê o banco direto.

- O canal é público: basta a chave **publishable** (`sb_publishable_...`), que é feita para ficar no front-end. Ela não dá acesso às tabelas, porque o `anon` não enxerga o schema `createit`. Nunca use a **secret key** no front-end.
- A API na Vercel não precisa de websocket: quem mantém a conexão é o Supabase.
- Sem as variáveis `*_SUPABASE_*`, o site e o app funcionam normalmente, só não se atualizam sozinhos.

### Administradores

Quem tem `admin = true` modera pelo próprio site e app:

- **Postagens:** a lixeira aparece em todas, não só nas suas. Os pontos que a postagem deu saem do saldo do autor até zerar (se ele já gastou em resgates, o saldo para em 0 em vez de barrar).
- **Comentários:** lixeira em cada comentário (quem escreveu também pode apagar o seu).
- **Curtidas:** na tela da postagem, a lista "Curtidas" (só admin vê) tem um X para tirar cada uma.
- **Contas:** menu **Admin** no site (ou o botão **Admin** no seu perfil, no app) para buscar, editar nome, @, e-mail, cidade, bio, pontos, nível e acesso de admin, ou apagar a conta. No perfil de outra pessoa, o botão **Gerenciar** abre direto a conta dela.

A API confere o admin no banco a cada pedido, então tirar o acesso de alguém vale na hora. Um admin não consegue tirar o próprio acesso nem apagar a própria conta pelo painel. O primeiro admin é criado pelo SQL Editor:

```sql
UPDATE createit.usuario SET admin = true WHERE email = 'voce@email.com';
```

Os outros podem ser promovidos pelo painel.

### Rodando com Postgres local (opcional)

Os mesmos scripts funcionam num PostgreSQL 16 instalado na máquina. Crie um banco `createit`, rode os scripts 01, 02, 03 e 05 com o usuário `postgres` (o 04 e o 06 são só do Supabase) e use `DATABASE_URL=postgres://app_createit:<senha>@localhost:5432/createit`.

## Onde os conceitos de banco aparecem

| Conceito | Onde |
|---|---|
| Integridade referencial | FKs com `ON DELETE CASCADE / SET NULL` em todas as tabelas |
| Constraints | `CHECK` de saldo nunca negativo, status válidos, datas do desafio, ninguém segue a si mesmo |
| Trigger | `trg_creditar_pontos`: ao validar uma postagem, credita os pontos, atualiza o nível e libera conquistas. `trg_estornar_pontos`: ao apagar, tira os pontos e as conquistas que ela deu (o `CHECK` do saldo barra se os pontos já foram gastos) |
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
| PUT | `/api/auth/eu` | edita nome, @usuário, bio e cidade |
| GET | `/api/postagens/feed?filtro=seguindo\|alta` | feed |
| POST | `/api/postagens` | registra uma ação (ganha pontos); multipart, com campo `foto` opcional |
| GET | `/api/postagens/:id` | uma postagem |
| DELETE | `/api/postagens/:id` | apaga a própria postagem (estorna os pontos, apaga a foto) |
| POST | `/api/postagens/:id/curtir` | curte ou descurte |
| GET | `/api/postagens/:id/comentarios` | comentários com o autor, mais recentes primeiro |
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

- Validação das ações por moderador (hoje é automática)
- Foto de perfil (o upload para o Storage já existe, falta a coluna e a tela)
