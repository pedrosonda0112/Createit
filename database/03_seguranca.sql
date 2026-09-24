-- =====================================================================
-- Create It - Perfis de acesso (GRANT / REVOKE)
-- Rodar como superusuário (postgres) depois do 01 e do 02.
-- Troque as senhas antes de usar em produção.
-- =====================================================================

-- Papéis (grupos de permissão)
CREATE ROLE papel_app       NOLOGIN;  -- o back-end da aplicação
CREATE ROLE papel_relatorio NOLOGIN;  -- só leitura, para relatórios e patrocinadores
CREATE ROLE papel_admin     NOLOGIN;  -- manutenção do banco

-- Usuários de login que herdam os papéis
CREATE ROLE app_createit      LOGIN PASSWORD 'troque-esta-senha' IN ROLE papel_app;
CREATE ROLE relatorio_createit LOGIN PASSWORD 'troque-esta-senha' IN ROLE papel_relatorio;

-- Ninguém usa o schema sem permissão explícita
REVOKE ALL ON SCHEMA createit FROM PUBLIC;

-- Admin: acesso total
GRANT ALL ON SCHEMA createit TO papel_admin;
GRANT ALL ON ALL TABLES IN SCHEMA createit TO papel_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA createit TO papel_admin;

-- Aplicação: lê e grava dados, mas não altera a estrutura
GRANT USAGE ON SCHEMA createit TO papel_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA createit TO papel_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA createit TO papel_app;
GRANT EXECUTE ON FUNCTION createit.fn_resgatar(INTEGER, INTEGER) TO papel_app;
-- A aplicação não pode mexer no catálogo de categorias nem apagar resgates (histórico)
REVOKE INSERT, UPDATE, DELETE ON createit.categoria_acao FROM papel_app;
REVOKE DELETE ON createit.resgate FROM papel_app;

-- Relatórios: só as views, sem dados pessoais (CPF, e-mail, senha)
GRANT USAGE ON SCHEMA createit TO papel_relatorio;
GRANT SELECT ON createit.vw_ranking, createit.vw_impacto_categoria TO papel_relatorio;
