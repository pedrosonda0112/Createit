-- =====================================================================
-- Create It - Resgates de demonstração (MySQL 8)
-- Complemento do 05_dados_demo.sql para bancos que não têm as contas antigas
-- do seed (Marina, Rafael, Lucas e Carla): enche a aba Vouchers dos patrocinadores.
--
-- 1) Dá "pontos de histórico" às contas novas do 05, como o 02_seed.sql faz com
--    as contas originais. O saldo final de cada uma já sai definido (ranking).
-- 2) Resgata recompensas com as mesmas regras da sp_resgatar (saldo, estoque, validade).
--
-- Pode rodar mais de uma vez: quem já tem os vouchers deste script é pulado.
-- Rode DEPOIS do 05. Execute o arquivo INTEIRO (Cmd+A e depois Execute).
-- =====================================================================

SET NAMES utf8mb4;
USE createit;

-- 1) Pontos de histórico: saldo final + o que a conta vai gastar nos resgates

UPDATE usuario u SET u.pontos_ecologicos = GREATEST(u.pontos_ecologicos, 3550)
 WHERE u.email = 'thiago@createit.com'
   AND NOT EXISTS (SELECT 1 FROM resgate r WHERE r.id_usuario = u.id_usuario AND r.codigo_voucher IN ('CRT-TG01', 'CRT-TG02'));
UPDATE usuario u SET u.pontos_ecologicos = GREATEST(u.pontos_ecologicos, 2350)
 WHERE u.email = 'camila@createit.com'
   AND NOT EXISTS (SELECT 1 FROM resgate r WHERE r.id_usuario = u.id_usuario AND r.codigo_voucher IN ('CRT-CF01', 'CRT-CF02'));
UPDATE usuario u SET u.pontos_ecologicos = GREATEST(u.pontos_ecologicos, 1730)
 WHERE u.email = 'bia@createit.com'
   AND NOT EXISTS (SELECT 1 FROM resgate r WHERE r.id_usuario = u.id_usuario AND r.codigo_voucher IN ('CRT-BN01', 'CRT-BN02'));
UPDATE usuario u SET u.pontos_ecologicos = GREATEST(u.pontos_ecologicos, 3270)
 WHERE u.email = 'eduardo@createit.com'
   AND NOT EXISTS (SELECT 1 FROM resgate r WHERE r.id_usuario = u.id_usuario AND r.codigo_voucher IN ('CRT-ES01', 'CRT-ES02'));
UPDATE usuario u SET u.pontos_ecologicos = GREATEST(u.pontos_ecologicos, 1710)
 WHERE u.email = 'fernanda@createit.com'
   AND NOT EXISTS (SELECT 1 FROM resgate r WHERE r.id_usuario = u.id_usuario AND r.codigo_voucher IN ('CRT-FR01', 'CRT-FR02'));
UPDATE usuario u SET u.pontos_ecologicos = GREATEST(u.pontos_ecologicos, 1040)
 WHERE u.email = 'juliana@createit.com'
   AND NOT EXISTS (SELECT 1 FROM resgate r WHERE r.id_usuario = u.id_usuario AND r.codigo_voucher IN ('CRT-JP01'));
UPDATE usuario u SET u.pontos_ecologicos = GREATEST(u.pontos_ecologicos, 1620)
 WHERE u.email = 'larissa@createit.com'
   AND NOT EXISTS (SELECT 1 FROM resgate r WHERE r.id_usuario = u.id_usuario AND r.codigo_voucher IN ('CRT-LM01', 'CRT-LM02'));
UPDATE usuario u SET u.pontos_ecologicos = GREATEST(u.pontos_ecologicos, 940)
 WHERE u.email = 'gabriel@createit.com'
   AND NOT EXISTS (SELECT 1 FROM resgate r WHERE r.id_usuario = u.id_usuario AND r.codigo_voucher IN ('CRT-GC01'));
UPDATE usuario u SET u.pontos_ecologicos = GREATEST(u.pontos_ecologicos, 430)
 WHERE u.email = 'diego@createit.com'
   AND NOT EXISTS (SELECT 1 FROM resgate r WHERE r.id_usuario = u.id_usuario AND r.codigo_voucher IN (''));
UPDATE usuario u SET u.pontos_ecologicos = GREATEST(u.pontos_ecologicos, 380)
 WHERE u.email = 'bruno@createit.com'
   AND NOT EXISTS (SELECT 1 FROM resgate r WHERE r.id_usuario = u.id_usuario AND r.codigo_voucher IN (''));
-- 2) Resgates. O voucher entra como 'expirado' (marca de "ainda não cobrado");
--    os dois UPDATEs seguintes cobram só esses; o último tira a marca.
INSERT INTO resgate (id_usuario, id_recompensa, codigo_voucher, status, pontos_gastos, data_resgate)
SELECT u.id_usuario, r.id_recompensa, x.codigo, 'expirado', r.custo_pontos, DATE_SUB(UTC_TIMESTAMP(), INTERVAL x.horas HOUR) FROM (
        SELECT 'thiago@createit.com' AS email, 'Calibragem e lubrificação grátis' AS titulo, 'CRT-TG01' AS codigo, 2100 AS total, 6 AS horas
        UNION ALL SELECT 'thiago@createit.com', 'Kit de luz de segurança para bike', 'CRT-TG02', 2100, 17
        UNION ALL SELECT 'camila@createit.com', 'Vaso autoirrigável', 'CRT-CF01', 1250, 28
        UNION ALL SELECT 'camila@createit.com', 'Pacote de sementes de horta', 'CRT-CF02', 1250, 39
        UNION ALL SELECT 'bia@createit.com', 'Pote de vidro de 1 litro', 'CRT-BN01', 750, 50
        UNION ALL SELECT 'bia@createit.com', 'Sacola de algodão cru', 'CRT-BN02', 750, 61
        UNION ALL SELECT 'eduardo@createit.com', 'Aula de mecânica básica', 'CRT-ES01', 2400, 72
        UNION ALL SELECT 'eduardo@createit.com', 'Caneca de cerâmica Café da Esquina', 'CRT-ES02', 2400, 83
        UNION ALL SELECT 'fernanda@createit.com', 'Pão de queijo com café coado', 'CRT-FR01', 950, 94
        UNION ALL SELECT 'fernanda@createit.com', 'Pacote de sementes de horta', 'CRT-FR02', 950, 105
        UNION ALL SELECT 'juliana@createit.com', 'Pote de vidro de 1 litro', 'CRT-JP01', 350, 116
        UNION ALL SELECT 'larissa@createit.com', 'Pão de queijo com café coado', 'CRT-LM01', 1000, 127
        UNION ALL SELECT 'larissa@createit.com', 'Calibragem e lubrificação grátis', 'CRT-LM02', 1000, 138
        UNION ALL SELECT 'gabriel@createit.com', 'Sacola de algodão cru', 'CRT-GC01', 400, 149
       ) x
  JOIN usuario u    ON u.email = x.email
  JOIN recompensa r ON r.titulo = x.titulo
 WHERE r.estoque > 0 AND r.validade >= CURRENT_DATE()
   AND u.pontos_ecologicos >= x.total
   AND NOT EXISTS (SELECT 1 FROM resgate e WHERE e.codigo_voucher = x.codigo);

UPDATE usuario u
  JOIN (SELECT id_usuario, SUM(pontos_gastos) AS total FROM resgate
         WHERE codigo_voucher IN ('CRT-TG01', 'CRT-TG02', 'CRT-CF01', 'CRT-CF02', 'CRT-BN01', 'CRT-BN02', 'CRT-ES01', 'CRT-ES02', 'CRT-FR01', 'CRT-FR02', 'CRT-JP01', 'CRT-LM01', 'CRT-LM02', 'CRT-GC01') AND status = 'expirado'
         GROUP BY id_usuario) t ON t.id_usuario = u.id_usuario
   SET u.pontos_ecologicos = u.pontos_ecologicos - t.total;

UPDATE recompensa r
  JOIN (SELECT id_recompensa, COUNT(*) AS qtd FROM resgate
         WHERE codigo_voucher IN ('CRT-TG01', 'CRT-TG02', 'CRT-CF01', 'CRT-CF02', 'CRT-BN01', 'CRT-BN02', 'CRT-ES01', 'CRT-ES02', 'CRT-FR01', 'CRT-FR02', 'CRT-JP01', 'CRT-LM01', 'CRT-LM02', 'CRT-GC01') AND status = 'expirado'
         GROUP BY id_recompensa) t ON t.id_recompensa = r.id_recompensa
   SET r.estoque = r.estoque - t.qtd;

UPDATE resgate SET status = IF(codigo_voucher IN ('CRT-TG01', 'CRT-CF01', 'CRT-BN01', 'CRT-ES01', 'CRT-FR01'), 'usado', 'ativo')
 WHERE codigo_voucher IN ('CRT-TG01', 'CRT-TG02', 'CRT-CF01', 'CRT-CF02', 'CRT-BN01', 'CRT-BN02', 'CRT-ES01', 'CRT-ES02', 'CRT-FR01', 'CRT-FR02', 'CRT-JP01', 'CRT-LM01', 'CRT-LM02', 'CRT-GC01') AND status = 'expirado';

-- Nível pelo saldo final (só sobe, nunca desce)
UPDATE usuario SET nivel = GREATEST(nivel, 1 + pontos_ecologicos DIV 500)
 WHERE email IN ('thiago@createit.com', 'camila@createit.com', 'bia@createit.com', 'eduardo@createit.com', 'fernanda@createit.com', 'juliana@createit.com', 'larissa@createit.com', 'gabriel@createit.com', 'diego@createit.com', 'bruno@createit.com');

-- Conferência: deve mostrar 14 vouchers
SELECT p.razao_social AS empresa, r.titulo, rg.codigo_voucher, rg.status, u.nome
  FROM resgate rg
  JOIN recompensa r   ON r.id_recompensa = rg.id_recompensa
  JOIN patrocinador p ON p.id_patrocinador = r.id_patrocinador
  JOIN usuario u      ON u.id_usuario = rg.id_usuario
 WHERE rg.codigo_voucher IN ('CRT-TG01', 'CRT-TG02', 'CRT-CF01', 'CRT-CF02', 'CRT-BN01', 'CRT-BN02', 'CRT-ES01', 'CRT-ES02', 'CRT-FR01', 'CRT-FR02', 'CRT-JP01', 'CRT-LM01', 'CRT-LM02', 'CRT-GC01')
 ORDER BY empresa, r.titulo;
