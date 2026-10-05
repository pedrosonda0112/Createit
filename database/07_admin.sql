-- =====================================================================
-- Create It - Administradores (moderação pelo app)
-- Rodar como postgres (no Supabase: SQL Editor) depois dos anteriores.
-- Não apaga nada do banco e pode rodar quantas vezes quiser.
--
-- Quem tem usuario.admin = true pode, pelo site e pelo app: apagar qualquer
-- postagem, comentário ou curtida, editar qualquer usuário (inclusive pontos,
-- nível e se é admin) e apagar usuários. A API confere isso no banco a cada
-- pedido, então tirar o admin de alguém vale na hora.
--
-- Para tornar alguém admin (só pelo SQL Editor ou por outro admin no app):
--   UPDATE createit.usuario SET admin = true WHERE email = 'voce@email.com';
-- =====================================================================
SET search_path TO createit;

ALTER TABLE usuario ADD COLUMN IF NOT EXISTS admin BOOLEAN NOT NULL DEFAULT false;

-- Substitui a versão do 05_apagar_postagem.sql.
-- Moderação: quando um admin apaga pelo app, a API liga createit.moderacao na
-- transação. Aí o estorno tira os pontos só até zerar (os que já viraram
-- resgate ficam como estão), em vez de o CHECK barrar o DELETE.
-- Fora da moderação continua igual: com os pontos já gastos, o DELETE é barrado.
CREATE OR REPLACE FUNCTION fn_estornar_pontos() RETURNS trigger AS $$
BEGIN
    IF OLD.status_validacao = 'validada' THEN
        UPDATE usuario
           SET pontos_ecologicos = CASE
                   WHEN current_setting('createit.moderacao', true) = 'on'
                   THEN GREATEST(pontos_ecologicos - OLD.pontos_gerados, 0)
                   ELSE pontos_ecologicos - OLD.pontos_gerados
               END
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
