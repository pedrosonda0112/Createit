import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

// As fotos ficam no Supabase Storage, num bucket público (criado no 04_storage.sql).
// O back-end envia usando a chave secreta do projeto, que nunca vai para o front-end.
const URL_BASE = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const CHAVE = process.env.SUPABASE_SECRET_KEY || '';
const BUCKET = process.env.SUPABASE_BUCKET || 'fotos';

const remoto = Boolean(URL_BASE && CHAVE);
export const pastaFotos = process.env.UPLOAD_DIR
  || (!process.env.VERCEL && fileURLToPath(new URL('../uploads/', import.meta.url)));
const prefixoLocal = '/api/fotos/';
export const storageConfigurado = () => remoto || Boolean(pastaFotos);

// Descobre o tipo da imagem pelos primeiros bytes do arquivo,
// sem confiar no tipo que o navegador informou
export function tipoImagem(buffer) {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (buffer.toString('latin1', 0, 8) === '\x89PNG\r\n\x1a\n') return { mime: 'image/png', ext: 'png' };
  if (buffer.toString('latin1', 0, 4) === 'RIFF' && buffer.toString('latin1', 8, 12) === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  return null;
}

const cabecalhos = () => ({ apikey: CHAVE, Authorization: `Bearer ${CHAVE}` });

// Envia a foto para <pasta>/<nome aleatório> e devolve a URL pública
export async function enviarFoto(pasta, { buffer, tipo }) {
  const caminho = `${pasta}/${randomUUID()}.${tipo.ext}`;
  if (!remoto) {
    await mkdir(path.join(pastaFotos, pasta), { recursive: true });
    await writeFile(path.join(pastaFotos, caminho), buffer, { flag: 'wx' });
    return prefixoLocal + caminho;
  }
  const resp = await fetch(`${URL_BASE}/storage/v1/object/${BUCKET}/${caminho}`, {
    method: 'POST',
    headers: { ...cabecalhos(), 'Content-Type': tipo.mime, 'Cache-Control': 'max-age=31536000' },
    body: buffer,
  });
  if (!resp.ok) throw new Error(`Supabase Storage respondeu ${resp.status}: ${await resp.text()}`);
  return `${URL_BASE}/storage/v1/object/public/${BUCKET}/${caminho}`;
}

// Apaga uma foto enviada por nós (usado quando a postagem não chega a ser gravada)
export async function apagarFoto(url) {
  if (pastaFotos && url.startsWith(prefixoLocal)) {
    const arquivo = url.slice(prefixoLocal.length);
    if (/^postagens\/[0-9]+\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(arquivo)) {
      await rm(path.join(pastaFotos, arquivo), { force: true });
    }
    return;
  }
  const prefixo = `${URL_BASE}/storage/v1/object/public/${BUCKET}/`;
  if (!url.startsWith(prefixo)) return;
  await fetch(`${URL_BASE}/storage/v1/object/${BUCKET}/${url.slice(prefixo.length)}`, {
    method: 'DELETE',
    headers: cabecalhos(),
  });
}
