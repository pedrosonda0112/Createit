# Create It: banco em MySQL

Versão MySQL 8 dos scripts de `database/` (que são PostgreSQL/Supabase). Sugestão: salvar esta pasta como `database-mysql/` no repositório.

## Como rodar

```bash
mysql -u root -p < 01_schema.sql      # cria o banco createit, tabelas, triggers, procedure e views
mysql -u root -p < 02_seed.sql        # dados de teste (senha de todos: create123)
mysql -u root -p < 03_seguranca.sql   # papéis e usuários (troque as senhas antes!)
```

No Workbench, abra o arquivo e execute tudo (ele entende o `DELIMITER`). Num cliente que não entende `DELIMITER`, rode os blocos de trigger e procedure um por vez.

## Mapa dos scripts

| PostgreSQL | MySQL | O que mudou |
|---|---|---|
| `01_schema.sql` | `01_schema.sql` | Já inclui a coluna `admin` (do 07) e o trigger de estorno (do 05, na versão com moderação do 07) |
| `02_seed.sql` | `02_seed.sql` | Datas com `DATE_SUB/DATE_ADD`, `DIV` no cálculo do nível, `CALL sp_resgatar` |
| `03_seguranca.sql` | `03_seguranca.sql` | `CREATE ROLE`/`CREATE USER`, GRANT tabela por tabela |
| `04_storage.sql` | (não existe) | Bucket do Supabase Storage. As fotos continuam no Supabase Storage, que o back-end já usa por chave própria, ou vão para outro lugar |
| `05_apagar_postagem.sql` | dentro do `01` | Trigger `trg_estornar_pontos` |
| `06_tempo_real.sql` | (não existe) | Usa `realtime.send` do Supabase. Sem ele o feed só atualiza ao recarregar (o app já funciona assim sem as variáveis `*_SUPABASE_*`) |
| `07_admin.sql` | dentro do `01` | Coluna `admin` e trigger de estorno com moderação |

## Diferenças que importam

- **Schema:** o `schema createit` do Postgres virou o `DATABASE createit`.
- **Horários:** `TIMESTAMPTZ` virou `DATETIME` em UTC (`DEFAULT (UTC_TIMESTAMP())`). No mysql2 use `timezone: 'Z'`.
- **`fn_resgatar` virou procedure** `sp_resgatar(id_usuario, id_recompensa)`: devolve uma linha com a coluna `codigo`. Erros de regra saem com SQLSTATE `45000` e a mensagem em português (no Postgres era `P0001`). Ela abre a própria transação, então não chame dentro de outro `BEGIN`.
- **Trigger de crédito:** no MySQL o `SET` do `UPDATE` já enxerga o valor novo das colunas já atribuídas, por isso `nivel` vem antes de `pontos_ecologicos`.
- **Moderação:** `SET LOCAL createit.moderacao = 'on'` virou a variável de sessão `SET @createit_moderacao = 'on'` (e `SET @createit_moderacao = NULL` ao terminar, porque a variável vale para a conexão inteira, não só para a transação).
- **Cascata não dispara trigger no MySQL.** Apagar um usuário apaga as postagens dele, mas o `trg_estornar_pontos` não roda nelas. Como a conta some junto, não faz diferença.
- **Segurança:** o MySQL não tem REVOKE parcial dentro de um GRANT de schema inteiro. Por isso o `papel_app` recebe GRANT tabela por tabela, sem escrita em `categoria_acao` e sem DELETE em `resgate`.
- **Comparação de texto:** a collation `utf8mb4_unicode_ci` ignora maiúsculas e acentos. `Marina@x.com` e `marina@x.com` contam como o mesmo e-mail (no Postgres eram diferentes).

## O que ainda precisa mudar no back-end (`backend/src`)

O back-end ainda fala PostgreSQL (`pg`). Para rodar em MySQL é preciso:

- trocar `pg` por `mysql2` e reescrever `db.js` (sem `search_path`; pool com `timezone: 'Z'`);
- `$1, $2` → `?`, e `ILIKE` → `LIKE`;
- `RETURNING id_postagem` → usar `insertId` do resultado;
- `rows`/`rowCount` → o mysql2 devolve `[rows, fields]` e `affectedRows`;
- `SELECT fn_resgatar($1,$2)` → `CALL sp_resgatar(?, ?)`, tratando o erro `ER_SIGNAL_EXCEPTION` (código 1644);
- `count(*)::int`, `false AS curtiu` e `EXISTS (...)` em `SELECT` (booleanos voltam como 0/1);
- `SET LOCAL createit.moderacao` → `SET @createit_moderacao`.

## Um aviso de segurança

O `database/03_seguranca.sql` do repositório (público) tem uma senha de banco escrita. Troque essa senha no Supabase e não suba senha real no GitHub. A versão MySQL usa `TROQUE_ESTA_SENHA_...`.
