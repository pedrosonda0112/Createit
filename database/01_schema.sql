-- =====================================================================
-- Create It - Script de criação do banco (PostgreSQL 16)
-- A3 Banco de Dados - Universidade Anhembi Morumbi
--
-- Funciona no Supabase (cole no SQL Editor e clique em Run) e em Postgres local.
-- As tabelas ficam no schema "createit", separado do "public" que o Supabase
-- expõe automaticamente na API REST. Assim senha, CPF e e-mail não vazam.
-- =====================================================================

DROP SCHEMA IF EXISTS createit CASCADE;
CREATE SCHEMA createit;
SET search_path TO createit;

-- ---------------------------------------------------------------------
-- Tabelas principais
-- ---------------------------------------------------------------------
CREATE TABLE usuario (
    id_usuario         SERIAL PRIMARY KEY,
    nome               VARCHAR(120) NOT NULL,
    cpf                CHAR(11)     NOT NULL UNIQUE,
    email              VARCHAR(160) NOT NULL UNIQUE,
    senha_hash         TEXT         NOT NULL,
    usuario            VARCHAR(40)  NOT NULL UNIQUE,           -- o @usuario
    bio                VARCHAR(280),
    cidade             VARCHAR(80),
    pontos_ecologicos  INTEGER      NOT NULL DEFAULT 0 CHECK (pontos_ecologicos >= 0),
    nivel              INTEGER      NOT NULL DEFAULT 1 CHECK (nivel >= 1),
    data_cadastro      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE categoria_acao (
    id_categoria  SERIAL PRIMARY KEY,
    nome          VARCHAR(40) NOT NULL UNIQUE,
    pontos_base   INTEGER     NOT NULL CHECK (pontos_base > 0)
);

CREATE TABLE patrocinador (
    id_patrocinador  SERIAL PRIMARY KEY,
    razao_social     VARCHAR(120) NOT NULL,
    cnpj             CHAR(14)     NOT NULL UNIQUE,
    porte            VARCHAR(20)  NOT NULL CHECK (porte IN ('micro','pequeno','medio','grande')),
    localizacao      VARCHAR(120)
);

CREATE TABLE desafio (
    id_desafio       SERIAL PRIMARY KEY,
    id_patrocinador  INTEGER REFERENCES patrocinador(id_patrocinador) ON DELETE SET NULL, -- nulo = desafio da comunidade
    id_categoria     INTEGER NOT NULL REFERENCES categoria_acao(id_categoria),
    titulo           VARCHAR(120) NOT NULL,
    descricao        TEXT,
    meta_acoes       INTEGER NOT NULL CHECK (meta_acoes > 0),
    pontos_bonus     INTEGER NOT NULL CHECK (pontos_bonus >= 0),
    data_inicio      DATE    NOT NULL,
    data_fim         DATE    NOT NULL,
    CHECK (data_fim >= data_inicio)
);

CREATE TABLE postagem (
    id_postagem       SERIAL PRIMARY KEY,
    id_usuario        INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_categoria      INTEGER NOT NULL REFERENCES categoria_acao(id_categoria),
    id_desafio        INTEGER REFERENCES desafio(id_desafio) ON DELETE SET NULL,
    conteudo          TEXT    NOT NULL CHECK (length(trim(conteudo)) > 0),
    url_foto          TEXT,
    pontos_gerados    INTEGER NOT NULL DEFAULT 0 CHECK (pontos_gerados >= 0),
    status_validacao  VARCHAR(10) NOT NULL DEFAULT 'pendente'
                      CHECK (status_validacao IN ('pendente','validada','recusada')),
    data_postagem     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Interações (tabelas associativas N:N)
-- ---------------------------------------------------------------------
CREATE TABLE seguidor (
    id_seguidor  INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_seguido   INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    data_inicio  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (id_seguidor, id_seguido),
    CHECK (id_seguidor <> id_seguido)
);

CREATE TABLE curtida (
    id_usuario    INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_postagem   INTEGER NOT NULL REFERENCES postagem(id_postagem) ON DELETE CASCADE,
    data_curtida  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (id_usuario, id_postagem)
);

CREATE TABLE comentario (
    id_comentario    SERIAL PRIMARY KEY,
    id_usuario       INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_postagem      INTEGER NOT NULL REFERENCES postagem(id_postagem) ON DELETE CASCADE,
    texto            VARCHAR(500) NOT NULL,
    data_comentario  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE compartilhamento (
    id_compartilhamento  SERIAL PRIMARY KEY,
    id_usuario           INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_postagem          INTEGER NOT NULL REFERENCES postagem(id_postagem) ON DELETE CASCADE,
    tipo                 VARCHAR(10) NOT NULL CHECK (tipo IN ('repost','externo')),
    data                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE filiacao (
    id_usuario       INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_patrocinador  INTEGER NOT NULL REFERENCES patrocinador(id_patrocinador) ON DELETE CASCADE,
    data_filiacao    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (id_usuario, id_patrocinador)
);

-- ---------------------------------------------------------------------
-- Recompensas e gamificação
-- ---------------------------------------------------------------------
CREATE TABLE recompensa (
    id_recompensa    SERIAL PRIMARY KEY,
    id_patrocinador  INTEGER NOT NULL REFERENCES patrocinador(id_patrocinador) ON DELETE CASCADE,
    titulo           VARCHAR(120) NOT NULL,
    descricao        TEXT,
    custo_pontos     INTEGER NOT NULL CHECK (custo_pontos > 0),
    estoque          INTEGER NOT NULL CHECK (estoque >= 0),
    validade         DATE    NOT NULL
);

CREATE TABLE resgate (
    id_resgate      SERIAL PRIMARY KEY,
    id_usuario      INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_recompensa   INTEGER NOT NULL REFERENCES recompensa(id_recompensa),
    codigo_voucher  VARCHAR(12) NOT NULL UNIQUE,
    status          VARCHAR(10) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','usado','expirado')),
    pontos_gastos   INTEGER NOT NULL CHECK (pontos_gastos > 0),
    data_resgate    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE conquista (
    id_conquista  SERIAL PRIMARY KEY,
    nome          VARCHAR(60) NOT NULL UNIQUE,
    descricao     VARCHAR(200),
    id_categoria  INTEGER REFERENCES categoria_acao(id_categoria),  -- nulo = qualquer categoria
    qtd_acoes     INTEGER NOT NULL CHECK (qtd_acoes > 0)
);

CREATE TABLE usuario_conquista (
    id_usuario     INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_conquista   INTEGER NOT NULL REFERENCES conquista(id_conquista) ON DELETE CASCADE,
    data_obtencao  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (id_usuario, id_conquista)
);

-- ---------------------------------------------------------------------
-- Índices (consultas mais usadas: feed, perfil e ranking)
-- ---------------------------------------------------------------------
CREATE INDEX idx_postagem_usuario_data ON postagem (id_usuario, data_postagem DESC);
CREATE INDEX idx_postagem_data         ON postagem (data_postagem DESC);
CREATE INDEX idx_curtida_postagem      ON curtida (id_postagem);
CREATE INDEX idx_comentario_postagem   ON comentario (id_postagem);
CREATE INDEX idx_seguidor_seguido      ON seguidor (id_seguido);
CREATE INDEX idx_resgate_usuario       ON resgate (id_usuario);
CREATE INDEX idx_usuario_pontos        ON usuario (pontos_ecologicos DESC);

-- ---------------------------------------------------------------------
-- Trigger: quando a postagem é validada, credita os pontos no usuário,
-- atualiza o nível e libera as conquistas que ele atingiu
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_creditar_pontos() RETURNS trigger AS $$
DECLARE
    v_pontos INTEGER;
BEGIN
    IF NEW.status_validacao = 'validada' AND OLD.status_validacao <> 'validada' THEN
        SELECT pontos_base INTO v_pontos FROM categoria_acao WHERE id_categoria = NEW.id_categoria;
        NEW.pontos_gerados := v_pontos;

        UPDATE usuario
           SET pontos_ecologicos = pontos_ecologicos + v_pontos,
               nivel = GREATEST(nivel, 1 + (pontos_ecologicos + v_pontos) / 500)
         WHERE id_usuario = NEW.id_usuario;

        -- +1 porque a postagem atual ainda não está gravada como validada
        INSERT INTO usuario_conquista (id_usuario, id_conquista)
        SELECT NEW.id_usuario, c.id_conquista
          FROM conquista c
         WHERE (SELECT count(*) FROM postagem p
                 WHERE p.id_usuario = NEW.id_usuario
                   AND p.status_validacao = 'validada'
                   AND p.id_postagem <> NEW.id_postagem
                   AND (c.id_categoria IS NULL OR p.id_categoria = c.id_categoria))
               + CASE WHEN c.id_categoria IS NULL OR c.id_categoria = NEW.id_categoria THEN 1 ELSE 0 END
               >= c.qtd_acoes
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_creditar_pontos
BEFORE UPDATE OF status_validacao ON postagem
FOR EACH ROW EXECUTE FUNCTION fn_creditar_pontos();

-- ---------------------------------------------------------------------
-- Função de resgate: tudo numa transação só.
-- Trava o usuário e a recompensa, confere saldo, estoque e validade,
-- debita os pontos, baixa o estoque e gera o voucher.
-- Se qualquer passo falhar, nada é gravado.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_resgatar(p_usuario INTEGER, p_recompensa INTEGER)
RETURNS VARCHAR AS $$
DECLARE
    v_saldo    INTEGER;
    v_custo    INTEGER;
    v_estoque  INTEGER;
    v_validade DATE;
    v_codigo   VARCHAR(12);
BEGIN
    SELECT pontos_ecologicos INTO v_saldo FROM usuario WHERE id_usuario = p_usuario FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Usuário não encontrado'; END IF;

    SELECT custo_pontos, estoque, validade INTO v_custo, v_estoque, v_validade
      FROM recompensa WHERE id_recompensa = p_recompensa FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Recompensa não encontrada'; END IF;

    IF v_validade < CURRENT_DATE THEN RAISE EXCEPTION 'Essa recompensa já expirou'; END IF;
    IF v_estoque = 0 THEN RAISE EXCEPTION 'Essa recompensa esgotou'; END IF;
    IF v_saldo < v_custo THEN RAISE EXCEPTION 'Saldo insuficiente: faltam % pontos', v_custo - v_saldo; END IF;

    UPDATE usuario    SET pontos_ecologicos = pontos_ecologicos - v_custo WHERE id_usuario = p_usuario;
    UPDATE recompensa SET estoque = estoque - 1 WHERE id_recompensa = p_recompensa;

    LOOP
        v_codigo := 'CRT-' || upper(substr(md5(random()::text), 1, 4));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM resgate WHERE codigo_voucher = v_codigo);
    END LOOP;

    INSERT INTO resgate (id_usuario, id_recompensa, codigo_voucher, pontos_gastos)
    VALUES (p_usuario, p_recompensa, v_codigo, v_custo);

    RETURN v_codigo;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------
-- Feed: postagem já com autor, categoria, patrocinador e totais
CREATE VIEW vw_feed AS
SELECT p.id_postagem, p.id_usuario, u.nome, u.usuario, p.id_categoria, c.nome AS categoria,
       p.conteudo, p.url_foto, p.pontos_gerados, p.status_validacao, p.data_postagem,
       p.id_desafio, pt.razao_social AS patrocinador,
       (SELECT count(*) FROM curtida cu    WHERE cu.id_postagem = p.id_postagem)::int AS curtidas,
       (SELECT count(*) FROM comentario co WHERE co.id_postagem = p.id_postagem)::int AS comentarios
  FROM postagem p
  JOIN usuario u             ON u.id_usuario = p.id_usuario
  JOIN categoria_acao c      ON c.id_categoria = p.id_categoria
  LEFT JOIN desafio d        ON d.id_desafio = p.id_desafio
  LEFT JOIN patrocinador pt  ON pt.id_patrocinador = d.id_patrocinador;

-- Ranking geral por pontos
CREATE VIEW vw_ranking AS
SELECT id_usuario, nome, usuario, pontos_ecologicos,
       RANK() OVER (ORDER BY pontos_ecologicos DESC)::int AS posicao
  FROM usuario;

-- Impacto por categoria (usado no perfil e em relatórios para patrocinadores)
CREATE VIEW vw_impacto_categoria AS
SELECT p.id_usuario, c.nome AS categoria, count(*)::int AS acoes, sum(p.pontos_gerados)::int AS pontos
  FROM postagem p JOIN categoria_acao c ON c.id_categoria = p.id_categoria
 WHERE p.status_validacao = 'validada'
 GROUP BY p.id_usuario, c.nome;
