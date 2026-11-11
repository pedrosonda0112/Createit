-- =====================================================================
-- Create It - Script de criação do banco (MySQL 8)
-- A3 Banco de Dados - Universidade Anhembi Morumbi
--
-- Versão MySQL do 01_schema.sql (PostgreSQL). Já inclui o que os scripts
-- 05 (apagar postagem) e 07 (coluna admin) acrescentavam.
-- Rode com o cliente "mysql" ou o Workbench (o DELIMITER dos triggers e
-- da procedure é comando do cliente).
-- Horários ficam em UTC (DATETIME), igual ao TIMESTAMPTZ do Postgres.
-- =====================================================================

DROP DATABASE IF EXISTS createit;
CREATE DATABASE createit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE createit;

-- ---------------------------------------------------------------------
-- Tabelas principais
-- ---------------------------------------------------------------------
CREATE TABLE usuario (
    id_usuario         INT          NOT NULL AUTO_INCREMENT,
    nome               VARCHAR(120) NOT NULL,
    cpf                CHAR(11)     NOT NULL,
    email              VARCHAR(160) NOT NULL,
    senha_hash         VARCHAR(255) NOT NULL,
    usuario            VARCHAR(40)  NOT NULL,                 -- o @usuario
    bio                VARCHAR(280),
    cidade             VARCHAR(80),
    pontos_ecologicos  INT          NOT NULL DEFAULT 0,
    nivel              INT          NOT NULL DEFAULT 1,
    admin              BOOLEAN      NOT NULL DEFAULT FALSE,
    data_cadastro      DATETIME     NOT NULL DEFAULT (UTC_TIMESTAMP()),
    PRIMARY KEY (id_usuario),
    UNIQUE KEY uq_usuario_cpf (cpf),
    UNIQUE KEY uq_usuario_email (email),
    UNIQUE KEY uq_usuario_usuario (usuario),
    CONSTRAINT ck_usuario_pontos CHECK (pontos_ecologicos >= 0),
    CONSTRAINT ck_usuario_nivel  CHECK (nivel >= 1)
) ENGINE=InnoDB;

CREATE TABLE categoria_acao (
    id_categoria  INT         NOT NULL AUTO_INCREMENT,
    nome          VARCHAR(40) NOT NULL,
    pontos_base   INT         NOT NULL,
    PRIMARY KEY (id_categoria),
    UNIQUE KEY uq_categoria_nome (nome),
    CONSTRAINT ck_categoria_pontos CHECK (pontos_base > 0)
) ENGINE=InnoDB;

CREATE TABLE patrocinador (
    id_patrocinador  INT          NOT NULL AUTO_INCREMENT,
    razao_social     VARCHAR(120) NOT NULL,
    cnpj             CHAR(14)     NOT NULL,
    porte            VARCHAR(20)  NOT NULL,
    localizacao      VARCHAR(120),
    PRIMARY KEY (id_patrocinador),
    UNIQUE KEY uq_patrocinador_cnpj (cnpj),
    CONSTRAINT ck_patrocinador_porte CHECK (porte IN ('micro','pequeno','medio','grande'))
) ENGINE=InnoDB;

CREATE TABLE desafio (
    id_desafio       INT          NOT NULL AUTO_INCREMENT,
    id_patrocinador  INT          NULL,                      -- nulo = desafio da comunidade
    id_categoria     INT          NOT NULL,
    titulo           VARCHAR(120) NOT NULL,
    descricao        TEXT,
    meta_acoes       INT          NOT NULL,
    pontos_bonus     INT          NOT NULL,
    data_inicio      DATE         NOT NULL,
    data_fim         DATE         NOT NULL,
    PRIMARY KEY (id_desafio),
    CONSTRAINT fk_desafio_patrocinador FOREIGN KEY (id_patrocinador)
        REFERENCES patrocinador (id_patrocinador) ON DELETE SET NULL,
    CONSTRAINT fk_desafio_categoria FOREIGN KEY (id_categoria)
        REFERENCES categoria_acao (id_categoria),
    CONSTRAINT ck_desafio_meta   CHECK (meta_acoes > 0),
    CONSTRAINT ck_desafio_bonus  CHECK (pontos_bonus >= 0),
    CONSTRAINT ck_desafio_datas  CHECK (data_fim >= data_inicio)
) ENGINE=InnoDB;

CREATE TABLE postagem (
    id_postagem       INT         NOT NULL AUTO_INCREMENT,
    id_usuario        INT         NOT NULL,
    id_categoria      INT         NOT NULL,
    id_desafio        INT         NULL,
    conteudo          TEXT        NOT NULL,
    url_foto          TEXT,
    pontos_gerados    INT         NOT NULL DEFAULT 0,
    status_validacao  VARCHAR(10) NOT NULL DEFAULT 'pendente',
    data_postagem     DATETIME    NOT NULL DEFAULT (UTC_TIMESTAMP()),
    PRIMARY KEY (id_postagem),
    CONSTRAINT fk_postagem_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_postagem_categoria FOREIGN KEY (id_categoria)
        REFERENCES categoria_acao (id_categoria),
    CONSTRAINT fk_postagem_desafio FOREIGN KEY (id_desafio)
        REFERENCES desafio (id_desafio) ON DELETE SET NULL,
    CONSTRAINT ck_postagem_conteudo CHECK (CHAR_LENGTH(TRIM(conteudo)) > 0),
    CONSTRAINT ck_postagem_pontos   CHECK (pontos_gerados >= 0),
    CONSTRAINT ck_postagem_status   CHECK (status_validacao IN ('pendente','validada','recusada'))
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Interações (tabelas associativas N:N)
-- ---------------------------------------------------------------------
CREATE TABLE seguidor (
    id_seguidor  INT      NOT NULL,
    id_seguido   INT      NOT NULL,
    data_inicio  DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    PRIMARY KEY (id_seguidor, id_seguido),
    CONSTRAINT fk_seguidor_seguidor FOREIGN KEY (id_seguidor)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_seguidor_seguido FOREIGN KEY (id_seguido)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT ck_seguidor_diferente CHECK (id_seguidor <> id_seguido)
) ENGINE=InnoDB;

CREATE TABLE curtida (
    id_usuario    INT      NOT NULL,
    id_postagem   INT      NOT NULL,
    data_curtida  DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    PRIMARY KEY (id_usuario, id_postagem),
    CONSTRAINT fk_curtida_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_curtida_postagem FOREIGN KEY (id_postagem)
        REFERENCES postagem (id_postagem) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE comentario (
    id_comentario    INT          NOT NULL AUTO_INCREMENT,
    id_usuario       INT          NOT NULL,
    id_postagem      INT          NOT NULL,
    texto            VARCHAR(500) NOT NULL,
    data_comentario  DATETIME     NOT NULL DEFAULT (UTC_TIMESTAMP()),
    PRIMARY KEY (id_comentario),
    CONSTRAINT fk_comentario_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_comentario_postagem FOREIGN KEY (id_postagem)
        REFERENCES postagem (id_postagem) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE compartilhamento (
    id_compartilhamento  INT         NOT NULL AUTO_INCREMENT,
    id_usuario           INT         NOT NULL,
    id_postagem          INT         NOT NULL,
    tipo                 VARCHAR(10) NOT NULL,
    data                 DATETIME    NOT NULL DEFAULT (UTC_TIMESTAMP()),
    PRIMARY KEY (id_compartilhamento),
    CONSTRAINT fk_compart_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_compart_postagem FOREIGN KEY (id_postagem)
        REFERENCES postagem (id_postagem) ON DELETE CASCADE,
    CONSTRAINT ck_compart_tipo CHECK (tipo IN ('repost','externo'))
) ENGINE=InnoDB;

CREATE TABLE filiacao (
    id_usuario       INT      NOT NULL,
    id_patrocinador  INT      NOT NULL,
    data_filiacao    DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    PRIMARY KEY (id_usuario, id_patrocinador),
    CONSTRAINT fk_filiacao_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_filiacao_patrocinador FOREIGN KEY (id_patrocinador)
        REFERENCES patrocinador (id_patrocinador) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Recompensas e gamificação
-- ---------------------------------------------------------------------
CREATE TABLE recompensa (
    id_recompensa    INT          NOT NULL AUTO_INCREMENT,
    id_patrocinador  INT          NOT NULL,
    titulo           VARCHAR(120) NOT NULL,
    descricao        TEXT,
    custo_pontos     INT          NOT NULL,
    estoque          INT          NOT NULL,
    validade         DATE         NOT NULL,
    PRIMARY KEY (id_recompensa),
    CONSTRAINT fk_recompensa_patrocinador FOREIGN KEY (id_patrocinador)
        REFERENCES patrocinador (id_patrocinador) ON DELETE CASCADE,
    CONSTRAINT ck_recompensa_custo   CHECK (custo_pontos > 0),
    CONSTRAINT ck_recompensa_estoque CHECK (estoque >= 0)
) ENGINE=InnoDB;

CREATE TABLE resgate (
    id_resgate      INT         NOT NULL AUTO_INCREMENT,
    id_usuario      INT         NOT NULL,
    id_recompensa   INT         NOT NULL,
    codigo_voucher  VARCHAR(12) NOT NULL,
    status          VARCHAR(10) NOT NULL DEFAULT 'ativo',
    pontos_gastos   INT         NOT NULL,
    data_resgate    DATETIME    NOT NULL DEFAULT (UTC_TIMESTAMP()),
    PRIMARY KEY (id_resgate),
    UNIQUE KEY uq_resgate_voucher (codigo_voucher),
    CONSTRAINT fk_resgate_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_resgate_recompensa FOREIGN KEY (id_recompensa)
        REFERENCES recompensa (id_recompensa),
    CONSTRAINT ck_resgate_status CHECK (status IN ('ativo','usado','expirado')),
    CONSTRAINT ck_resgate_pontos CHECK (pontos_gastos > 0)
) ENGINE=InnoDB;

CREATE TABLE conquista (
    id_conquista  INT          NOT NULL AUTO_INCREMENT,
    nome          VARCHAR(60)  NOT NULL,
    descricao     VARCHAR(200),
    id_categoria  INT          NULL,                          -- nulo = qualquer categoria
    qtd_acoes     INT          NOT NULL,
    PRIMARY KEY (id_conquista),
    UNIQUE KEY uq_conquista_nome (nome),
    CONSTRAINT fk_conquista_categoria FOREIGN KEY (id_categoria)
        REFERENCES categoria_acao (id_categoria),
    CONSTRAINT ck_conquista_qtd CHECK (qtd_acoes > 0)
) ENGINE=InnoDB;

CREATE TABLE usuario_conquista (
    id_usuario     INT      NOT NULL,
    id_conquista   INT      NOT NULL,
    data_obtencao  DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    PRIMARY KEY (id_usuario, id_conquista),
    CONSTRAINT fk_uc_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_uc_conquista FOREIGN KEY (id_conquista)
        REFERENCES conquista (id_conquista) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Índices (consultas mais usadas: feed, perfil e ranking)
-- O MySQL já cria índice para cada FK; aqui ficam os de ordenação.
-- ---------------------------------------------------------------------
CREATE INDEX idx_postagem_usuario_data ON postagem (id_usuario, data_postagem);
CREATE INDEX idx_postagem_data         ON postagem (data_postagem);
CREATE INDEX idx_usuario_pontos        ON usuario (pontos_ecologicos);

-- ---------------------------------------------------------------------
-- Trigger: quando a postagem é validada, credita os pontos no usuário,
-- atualiza o nível e libera as conquistas que ele atingiu
-- ---------------------------------------------------------------------
DELIMITER $$

CREATE TRIGGER trg_creditar_pontos
BEFORE UPDATE ON postagem
FOR EACH ROW
BEGIN
    DECLARE v_pontos INT;

    IF NEW.status_validacao = 'validada' AND OLD.status_validacao <> 'validada' THEN
        SELECT pontos_base INTO v_pontos FROM categoria_acao WHERE id_categoria = NEW.id_categoria;
        SET NEW.pontos_gerados = v_pontos;

        -- ATENÇÃO: no MySQL o SET é avaliado da esquerda para a direita e já enxerga o valor
        -- novo das colunas. Por isso o nível vem ANTES dos pontos (no Postgres a ordem não importa).
        UPDATE usuario
           SET nivel = GREATEST(nivel, 1 + (pontos_ecologicos + v_pontos) DIV 500),
               pontos_ecologicos = pontos_ecologicos + v_pontos
         WHERE id_usuario = NEW.id_usuario;

        -- +1 porque a postagem atual ainda não está gravada como validada
        INSERT IGNORE INTO usuario_conquista (id_usuario, id_conquista)
        SELECT NEW.id_usuario, c.id_conquista
          FROM conquista c
         WHERE (SELECT COUNT(*) FROM postagem p
                 WHERE p.id_usuario = NEW.id_usuario
                   AND p.status_validacao = 'validada'
                   AND p.id_postagem <> NEW.id_postagem
                   AND (c.id_categoria IS NULL OR p.id_categoria = c.id_categoria))
               + CASE WHEN c.id_categoria IS NULL OR c.id_categoria = NEW.id_categoria THEN 1 ELSE 0 END
               >= c.qtd_acoes;
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Trigger: ao apagar uma postagem validada, tira os pontos e as conquistas
-- que ela deu. Se os pontos já foram gastos, o CHECK do saldo barra o DELETE.
-- Moderação: o back-end liga a variável de sessão @createit_moderacao = 'on'
-- e aí o estorno só tira os pontos até zerar (não barra).
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_estornar_pontos
AFTER DELETE ON postagem
FOR EACH ROW
BEGIN
    IF OLD.status_validacao = 'validada' THEN
        UPDATE usuario
           SET pontos_ecologicos = CASE
                   WHEN @createit_moderacao = 'on'
                   THEN GREATEST(pontos_ecologicos - OLD.pontos_gerados, 0)
                   ELSE pontos_ecologicos - OLD.pontos_gerados
               END
         WHERE id_usuario = OLD.id_usuario;

        -- AFTER DELETE: a postagem apagada já não entra na contagem
        DELETE uc FROM usuario_conquista uc
          JOIN conquista c ON c.id_conquista = uc.id_conquista
         WHERE uc.id_usuario = OLD.id_usuario
           AND (SELECT COUNT(*) FROM postagem p
                 WHERE p.id_usuario = OLD.id_usuario
                   AND p.status_validacao = 'validada'
                   AND (c.id_categoria IS NULL OR p.id_categoria = c.id_categoria))
               < c.qtd_acoes;
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Resgate: tudo numa transação só (no Postgres era a função fn_resgatar).
-- Trava o usuário e a recompensa, confere saldo, estoque e validade,
-- debita os pontos, baixa o estoque e gera o voucher.
-- Se qualquer passo falhar, nada é gravado (ROLLBACK) e o erro sobe com
-- SQLSTATE '45000' e a mensagem em português.
-- Uso: CALL sp_resgatar(id_usuario, id_recompensa);  -> devolve a coluna "codigo"
-- Não chame dentro de outra transação aberta: o START TRANSACTION dela faria COMMIT antes.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_resgatar(IN p_usuario INT, IN p_recompensa INT)
BEGIN
    DECLARE v_saldo    INT DEFAULT NULL;
    DECLARE v_custo    INT DEFAULT NULL;
    DECLARE v_estoque  INT DEFAULT NULL;
    DECLARE v_validade DATE DEFAULT NULL;
    DECLARE v_codigo   VARCHAR(12);
    DECLARE v_msg      VARCHAR(100);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT pontos_ecologicos INTO v_saldo FROM usuario WHERE id_usuario = p_usuario FOR UPDATE;
    IF v_saldo IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuário não encontrado';
    END IF;

    SELECT custo_pontos, estoque, validade INTO v_custo, v_estoque, v_validade
      FROM recompensa WHERE id_recompensa = p_recompensa FOR UPDATE;
    IF v_custo IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Recompensa não encontrada';
    END IF;

    IF v_validade < CURRENT_DATE() THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Essa recompensa já expirou';
    END IF;
    IF v_estoque = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Essa recompensa esgotou';
    END IF;
    IF v_saldo < v_custo THEN
        SET v_msg = CONCAT('Saldo insuficiente: faltam ', v_custo - v_saldo, ' pontos');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;

    UPDATE usuario    SET pontos_ecologicos = pontos_ecologicos - v_custo WHERE id_usuario = p_usuario;
    UPDATE recompensa SET estoque = estoque - 1 WHERE id_recompensa = p_recompensa;

    gera_codigo: LOOP
        SET v_codigo = CONCAT('CRT-', UPPER(SUBSTRING(MD5(RAND()), 1, 4)));
        IF NOT EXISTS (SELECT 1 FROM resgate WHERE codigo_voucher = v_codigo) THEN
            LEAVE gera_codigo;
        END IF;
    END LOOP;

    INSERT INTO resgate (id_usuario, id_recompensa, codigo_voucher, pontos_gastos)
    VALUES (p_usuario, p_recompensa, v_codigo, v_custo);

    COMMIT;
    SELECT v_codigo AS codigo;
END$$

DELIMITER ;

-- ---------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------
-- Feed: postagem já com autor, categoria, patrocinador e totais
CREATE VIEW vw_feed AS
SELECT p.id_postagem, p.id_usuario, u.nome, u.usuario, p.id_categoria, c.nome AS categoria,
       p.conteudo, p.url_foto, p.pontos_gerados, p.status_validacao, p.data_postagem,
       p.id_desafio, pt.razao_social AS patrocinador,
       CAST((SELECT COUNT(*) FROM curtida cu    WHERE cu.id_postagem = p.id_postagem) AS SIGNED) AS curtidas,
       CAST((SELECT COUNT(*) FROM comentario co WHERE co.id_postagem = p.id_postagem) AS SIGNED) AS comentarios
  FROM postagem p
  JOIN usuario u             ON u.id_usuario = p.id_usuario
  JOIN categoria_acao c      ON c.id_categoria = p.id_categoria
  LEFT JOIN desafio d        ON d.id_desafio = p.id_desafio
  LEFT JOIN patrocinador pt  ON pt.id_patrocinador = d.id_patrocinador;

-- Ranking geral por pontos
CREATE VIEW vw_ranking AS
SELECT id_usuario, nome, usuario, pontos_ecologicos,
       CAST(RANK() OVER (ORDER BY pontos_ecologicos DESC) AS SIGNED) AS posicao
  FROM usuario;

-- Impacto por categoria (usado no perfil e em relatórios para patrocinadores)
CREATE VIEW vw_impacto_categoria AS
SELECT p.id_usuario, c.nome AS categoria, CAST(COUNT(*) AS SIGNED) AS acoes,
       CAST(SUM(p.pontos_gerados) AS SIGNED) AS pontos
  FROM postagem p JOIN categoria_acao c ON c.id_categoria = p.id_categoria
 WHERE p.status_validacao = 'validada'
 GROUP BY p.id_usuario, c.nome;
