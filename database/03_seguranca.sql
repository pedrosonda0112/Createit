-- =====================================================================
-- Create It - Perfis de acesso (GRANT / REVOKE)
-- Rodar como postgres (no Supabase: SQL Editor) depois do 01 e do 02.
-- Pode rodar quantas vezes quiser: se os papéis já existem, só atualiza.
-- =====================================================================

-- Papéis (grupos de permissão) e usuários de login
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'papel_app')       THEN CREATE ROLE papel_app NOLOGIN;       END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'papel_relatorio') THEN CREATE ROLE papel_relatorio NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'papel_admin')     THEN CREATE ROLE papel_admin NOLOGIN;     END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_createit')       THEN CREATE ROLE app_createit LOGIN;       END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'relatorio_createit') THEN CREATE ROLE relatorio_createit LOGIN; END IF;
END $$;

-- >>> TROQUE AS SENHAS ABAIXO (só letras e números) <<<
ALTER ROLE app_createit       PASSWORD 'pedro030325';
ALTER ROLE relatorio_createit PASSWORD 'pedro030325';

GRANT papel_app       TO app_createit;
GRANT papel_relatorio TO relatorio_createit;

-- Quem conecta com esses usuários já cai direto no schema createit
ALTER ROLE app_createit       SET search_path = createit, public;
ALTER ROLE relatorio_createit SET search_path = createit, public;

-- Ninguém usa o schema sem permissão explícita
REVOKE ALL ON SCHEMA createit FROM PUBLIC;

-- No Supabase: os papéis da API pública (anon e authenticated)
-- não enxergam nada do schema createit (senhas, CPF, e-mails)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON SCHEMA createit FROM anon, authenticated';
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA createit FROM anon, authenticated';
    EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA createit FROM anon, authenticated';
  END IF;
END $$;

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
