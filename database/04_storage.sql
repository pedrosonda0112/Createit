-- =====================================================================
-- Create It - Bucket de fotos no Supabase Storage
-- Rodar como postgres no SQL Editor do Supabase (não existe no Postgres local).
-- Pode rodar quantas vezes quiser.
--
-- O bucket é público só para LEITURA: qualquer um abre a foto pela URL,
-- que é o que o feed precisa. Não há policy de escrita para anon e
-- authenticated, então só o back-end (com a chave secreta) consegue enviar.
-- =====================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('fotos', 'fotos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
   SET public             = EXCLUDED.public,
       file_size_limit    = EXCLUDED.file_size_limit,
       allowed_mime_types = EXCLUDED.allowed_mime_types;
