-- =====================================================================
-- Create It - Apagar postagem
-- Rodar como postgres (no Supabase: SQL Editor) depois dos anteriores.
-- Não apaga nada do banco e pode rodar quantas vezes quiser.
--
-- Quando uma postagem validada é apagada, o trigger desfaz o que ela deu:
-- tira os pontos do saldo e as conquistas que o usuário deixou de atingir.
-- Se esses pontos já foram gastos em resgates, o saldo ficaria negativo:
-- o CHECK (pontos_ecologicos >= 0) barra o DELETE e nada é apagado.
-- Curtidas, comentários e compartilhamentos saem pelo ON DELETE CASCADE.
-- O nível não cai, igual ao que acontece num resgate.
-- =====================================================================
SET search_path TO createit;

CREATE OR REPLACE FUNCTION fn_estornar_pontos() RETURNS trigger AS $$
BEGIN
    IF OLD.status_validacao = 'validada' THEN
        UPDATE usuario
           SET pontos_ecologicos = pontos_ecologicos - OLD.pontos_gerados
         WHERE id_usuario = OLD.id_usuario;

        -- AFTER DELETE: a postagem apagada já não entra na contagem
        DELETE FROM usuario_conquista uc
         USING conquista c
         WHERE c.id_conquista = uc.id_conquista
           AND uc.id_usuario = OLD.id_usuario
           AND (SELECT count(*) FROM postagem p
                 WHERE p.id_usuario = OLD.id_usuario
                   AND p.status_validacao = 'validada'
                   AND (c.id_categoria IS NULL OR p.id_categoria = c.id_categoria))
               < c.qtd_acoes;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_estornar_pontos ON postagem;
CREATE TRIGGER trg_estornar_pontos
AFTER DELETE ON postagem
FOR EACH ROW EXECUTE FUNCTION fn_estornar_pontos();
