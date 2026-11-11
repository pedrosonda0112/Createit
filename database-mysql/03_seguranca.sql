-- =====================================================================
-- Create It - Perfis de acesso (GRANT / REVOKE) - MySQL 8
-- Rode como root (ou outro usuário com CREATE USER / GRANT) depois do 01 e do 02.
--
-- >>> TROQUE AS SENHAS ABAIXO antes de rodar. Não deixe senha de verdade no GitHub. <<<
-- =====================================================================
USE createit;

-- Papéis (grupos de permissão)
CREATE ROLE IF NOT EXISTS 'papel_app', 'papel_relatorio', 'papel_admin';

-- Usuários de login
CREATE USER IF NOT EXISTS 'app_createit'@'%'       IDENTIFIED BY 'TROQUE_ESTA_SENHA_APP';
CREATE USER IF NOT EXISTS 'relatorio_createit'@'%' IDENTIFIED BY 'TROQUE_ESTA_SENHA_REL';

-- Admin: acesso total ao banco
GRANT ALL PRIVILEGES ON createit.* TO 'papel_admin';

-- Aplicação: lê e grava dados, mas não altera a estrutura.
-- No MySQL não dá para dar o schema inteiro e depois tirar uma tabela (REVOKE parcial),
-- então o GRANT é tabela por tabela. Fora da lista de INSERT/UPDATE/DELETE:
--   categoria_acao: só leitura (catálogo)
--   resgate: sem DELETE (histórico); o INSERT vem pela procedure
GRANT SELECT, INSERT, UPDATE, DELETE ON createit.usuario            TO 'papel_app';
GRANT SELECT, INSERT, UPDATE, DELETE ON createit.patrocinador       TO 'papel_app';
GRANT SELECT, INSERT, UPDATE, DELETE ON createit.desafio            TO 'papel_app';
GRANT SELECT, INSERT, UPDATE, DELETE ON createit.postagem           TO 'papel_app';
GRANT SELECT, INSERT, UPDATE, DELETE ON createit.seguidor           TO 'papel_app';
GRANT SELECT, INSERT, UPDATE, DELETE ON createit.curtida            TO 'papel_app';
GRANT SELECT, INSERT, UPDATE, DELETE ON createit.comentario         TO 'papel_app';
GRANT SELECT, INSERT, UPDATE, DELETE ON createit.compartilhamento   TO 'papel_app';
GRANT SELECT, INSERT, UPDATE, DELETE ON createit.filiacao           TO 'papel_app';
GRANT SELECT, INSERT, UPDATE, DELETE ON createit.recompensa         TO 'papel_app';
GRANT SELECT, INSERT, UPDATE, DELETE ON createit.conquista          TO 'papel_app';
GRANT SELECT, INSERT, UPDATE, DELETE ON createit.usuario_conquista  TO 'papel_app';
GRANT SELECT, INSERT, UPDATE         ON createit.resgate            TO 'papel_app';
GRANT SELECT                         ON createit.categoria_acao     TO 'papel_app';
GRANT SELECT ON createit.vw_feed              TO 'papel_app';
GRANT SELECT ON createit.vw_ranking           TO 'papel_app';
GRANT SELECT ON createit.vw_impacto_categoria TO 'papel_app';
GRANT EXECUTE ON PROCEDURE createit.sp_resgatar TO 'papel_app';

-- Relatórios: só as views sem dados pessoais (CPF, e-mail, senha)
GRANT SELECT ON createit.vw_ranking           TO 'papel_relatorio';
GRANT SELECT ON createit.vw_impacto_categoria TO 'papel_relatorio';

-- Liga cada usuário ao seu papel e já ativa o papel no login
GRANT 'papel_app'       TO 'app_createit'@'%';
GRANT 'papel_relatorio' TO 'relatorio_createit'@'%';
SET DEFAULT ROLE 'papel_app'       TO 'app_createit'@'%';
SET DEFAULT ROLE 'papel_relatorio' TO 'relatorio_createit'@'%';

-- Observação: os triggers rodam com o direito de quem os criou (DEFINER),
-- então o papel_app consegue creditar pontos e estornar mesmo sem UPDATE direto
-- em todas as colunas que o trigger toca.
