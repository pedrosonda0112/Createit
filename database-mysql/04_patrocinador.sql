-- =====================================================================
-- Create It - Acesso de patrocinadores (MySQL 8)
--
-- SÓ para um banco que já existia antes desta mudança (ex.: o do Aiven).
-- Num banco novo não precisa: o 01_schema.sql e o 02_seed.sql já têm tudo isso.
-- Pode rodar mais de uma vez sem dar erro. Não usa DELIMITER, então
-- funciona em qualquer cliente (Workbench, DBeaver, mysql, console do Aiven).
-- =====================================================================

SET NAMES utf8mb4;
USE createit;

-- 1) Coluna que liga a conta à empresa parceira (só cria se ainda não existir)
SET @tem_coluna := (SELECT COUNT(*) FROM information_schema.COLUMNS
                     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuario'
                       AND COLUMN_NAME = 'id_patrocinador');
SET @sql := IF(@tem_coluna = 0,
  'ALTER TABLE usuario ADD COLUMN id_patrocinador INT NULL AFTER admin',
  'DO 0');
PREPARE passo FROM @sql; EXECUTE passo; DEALLOCATE PREPARE passo;

-- 2) Chave estrangeira para patrocinador
SET @tem_fk := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuario'
                   AND CONSTRAINT_NAME = 'fk_usuario_patrocinador');
SET @sql := IF(@tem_fk = 0,
  'ALTER TABLE usuario ADD CONSTRAINT fk_usuario_patrocinador FOREIGN KEY (id_patrocinador) REFERENCES patrocinador (id_patrocinador) ON DELETE SET NULL',
  'DO 0');
PREPARE passo FROM @sql; EXECUTE passo; DEALLOCATE PREPARE passo;

-- 3) Views do painel do patrocinador
CREATE OR REPLACE VIEW vw_desafio_painel AS
SELECT d.id_desafio, d.id_patrocinador, d.id_categoria, c.nome AS categoria,
       d.titulo, d.descricao, d.meta_acoes, d.pontos_bonus, d.data_inicio, d.data_fim,
       CASE WHEN CURRENT_DATE() < d.data_inicio THEN 'agendado'
            WHEN CURRENT_DATE() > d.data_fim    THEN 'encerrado'
            ELSE 'ativo' END AS situacao,
       CAST((SELECT COUNT(DISTINCT p.id_usuario) FROM postagem p
              WHERE p.id_desafio = d.id_desafio) AS SIGNED) AS participantes,
       CAST((SELECT COUNT(*) FROM postagem p
              WHERE p.id_desafio = d.id_desafio AND p.status_validacao = 'validada') AS SIGNED) AS acoes_validadas,
       CAST((SELECT COUNT(*) FROM usuario u
              WHERE (SELECT COUNT(*) FROM postagem p
                      WHERE p.id_desafio = d.id_desafio AND p.id_usuario = u.id_usuario
                        AND p.status_validacao = 'validada') >= d.meta_acoes) AS SIGNED) AS concluintes
  FROM desafio d JOIN categoria_acao c ON c.id_categoria = d.id_categoria;

CREATE OR REPLACE VIEW vw_recompensa_painel AS
SELECT r.id_recompensa, r.id_patrocinador, r.titulo, r.descricao, r.custo_pontos, r.estoque, r.validade,
       CASE WHEN r.validade < CURRENT_DATE() THEN 'encerrada'
            WHEN r.estoque = 0              THEN 'esgotada'
            ELSE 'ativa' END AS situacao,
       CAST(COUNT(rg.id_resgate) AS SIGNED)                        AS resgates,
       CAST(COALESCE(SUM(rg.status = 'usado'), 0) AS SIGNED)       AS usados,
       CAST(COALESCE(SUM(rg.pontos_gastos), 0) AS SIGNED)          AS pontos_trocados
  FROM recompensa r LEFT JOIN resgate rg ON rg.id_recompensa = r.id_recompensa
 GROUP BY r.id_recompensa, r.id_patrocinador, r.titulo, r.descricao, r.custo_pontos, r.estoque, r.validade;

-- 4) Conta de teste do patrocinador Empório Granel Vivo (senha: create123)
INSERT IGNORE INTO usuario (nome, cpf, email, senha_hash, usuario, bio, cidade, id_patrocinador)
SELECT 'Empório Granel Vivo', '66666666666', 'patrocinador@createit.com',
       '$2a$10$SaVHXylx0VnPWPCtzAU7i.j7r/cTaL3aOYnBHxbr5Y98DTDTMmy5O',
       'granelvivo', 'Mercearia a granel. Traga seu pote!', 'Alphaville', id_patrocinador
  FROM patrocinador WHERE cnpj = '11222333000101';

-- 5) Só se você rodou o 03_seguranca.sql (papéis criados). Com o usuário avnadmin, pule.
-- GRANT SELECT ON createit.vw_desafio_painel    TO 'papel_app';
-- GRANT SELECT ON createit.vw_recompensa_painel TO 'papel_app';
