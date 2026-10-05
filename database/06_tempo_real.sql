-- =====================================================================
-- Create It - Tempo real (Supabase Realtime Broadcast)
-- Rodar como postgres (no Supabase: SQL Editor) depois dos anteriores.
-- Não apaga nada do banco e pode rodar quantas vezes quiser.
--
-- Os triggers avisam o canal público "feed" quando algo muda:
--   nova_postagem     { id_postagem, id_usuario }
--   postagem_apagada  { id_postagem }
--   novo_comentario   { id_postagem, id_comentario }
--   comentario_apagado { id_postagem, id_comentario }
--   contadores        { id_postagem, curtidas, comentarios }
-- O aviso leva só ids e totais, nunca texto: o canal é público (qualquer um com
-- a chave publishable pode ouvir). Quem recebe busca o resto pela API, com login.
-- A mensagem só sai depois do COMMIT; se a transação desfaz, ninguém é avisado.
-- O realtime.send nunca derruba a gravação: se falhar, só registra um WARNING.
-- =====================================================================
SET search_path TO createit;

-- SECURITY DEFINER: a API conecta como app_createit, que não pode gravar no
-- schema realtime. A função roda com o dono (postgres) só para enviar o aviso.
CREATE OR REPLACE FUNCTION fn_avisar_feed(p_evento TEXT, p_dados JSONB) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
    SELECT realtime.send(p_dados, p_evento, 'feed', false);
$$;
REVOKE ALL ON FUNCTION fn_avisar_feed(TEXT, JSONB) FROM PUBLIC;

-- Totais atuais da postagem (os mesmos da vw_feed)
CREATE OR REPLACE FUNCTION fn_avisar_contadores(p_postagem INTEGER) RETURNS void AS $$
BEGIN
    -- Curtidas e comentários que saem em cascata com a postagem: nada a contar
    IF NOT EXISTS (SELECT 1 FROM postagem WHERE id_postagem = p_postagem) THEN
        RETURN;
    END IF;
    PERFORM fn_avisar_feed('contadores', jsonb_build_object(
        'id_postagem', p_postagem,
        'curtidas',    (SELECT count(*) FROM curtida    WHERE id_postagem = p_postagem),
        'comentarios', (SELECT count(*) FROM comentario WHERE id_postagem = p_postagem)
    ));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_tempo_real_postagem() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM fn_avisar_feed('nova_postagem',
            jsonb_build_object('id_postagem', NEW.id_postagem, 'id_usuario', NEW.id_usuario));
    ELSE
        PERFORM fn_avisar_feed('postagem_apagada', jsonb_build_object('id_postagem', OLD.id_postagem));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_tempo_real_curtida() RETURNS trigger AS $$
BEGIN
    PERFORM fn_avisar_contadores(COALESCE(NEW.id_postagem, OLD.id_postagem));
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_tempo_real_comentario() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM fn_avisar_feed('novo_comentario',
            jsonb_build_object('id_postagem', NEW.id_postagem, 'id_comentario', NEW.id_comentario));
    -- Apagado sozinho (moderação ou o autor); em cascata com a postagem, não precisa
    ELSIF EXISTS (SELECT 1 FROM postagem WHERE id_postagem = OLD.id_postagem) THEN
        PERFORM fn_avisar_feed('comentario_apagado',
            jsonb_build_object('id_postagem', OLD.id_postagem, 'id_comentario', OLD.id_comentario));
    END IF;
    PERFORM fn_avisar_contadores(COALESCE(NEW.id_postagem, OLD.id_postagem));
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tempo_real_postagem ON postagem;
CREATE TRIGGER trg_tempo_real_postagem
AFTER INSERT OR DELETE ON postagem
FOR EACH ROW EXECUTE FUNCTION fn_tempo_real_postagem();

DROP TRIGGER IF EXISTS trg_tempo_real_curtida ON curtida;
CREATE TRIGGER trg_tempo_real_curtida
AFTER INSERT OR DELETE ON curtida
FOR EACH ROW EXECUTE FUNCTION fn_tempo_real_curtida();

DROP TRIGGER IF EXISTS trg_tempo_real_comentario ON comentario;
CREATE TRIGGER trg_tempo_real_comentario
AFTER INSERT OR DELETE ON comentario
FOR EACH ROW EXECUTE FUNCTION fn_tempo_real_comentario();

-- Quem grava nessas tabelas (API e admin) chama o aviso pelos triggers
GRANT EXECUTE ON FUNCTION fn_avisar_feed(TEXT, JSONB) TO papel_app, papel_admin;
