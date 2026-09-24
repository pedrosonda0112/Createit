export const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');

export const iniciais = (nome = '') =>
  nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';

export function tempo(data) {
  const s = (Date.now() - new Date(data).getTime()) / 1000;
  if (s < 60) return 'agora';
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  const d = Math.floor(s / 86400);
  return d === 1 ? '1d' : `${d}d`;
}

// Cada nível vale 500 pontos (mesma regra do trigger no banco)
export const PONTOS_POR_NIVEL = 500;
export const nomeNivel = (n) => ['Semente', 'Broto', 'Muda', 'Guardião', 'Protetor', 'Floresta'][Math.min(n, 6) - 1] || 'Floresta';

export const iconeCategoria = { Reciclagem: 'recycle', Transporte: 'bus', 'Água': 'drop', Energia: 'bolt' };

// Mesmo limite do back-end (middleware/foto.js)
export const LIMITE_FOTO = 5 * 1024 * 1024;

// Foto de celular tem de 4 a 8 MB: antes de enviar, reduz para no máximo 1600 px
// no lado maior, em JPEG. Fotos pequenas em JPG/PNG/WEBP vão como estão.
// Se o navegador não conseguir abrir a imagem, devolve o arquivo original.
export async function reduzirFoto(arquivo, ladoMax = 1600) {
  try {
    const img = await createImageBitmap(arquivo);
    const escala = Math.min(1, ladoMax / Math.max(img.width, img.height));
    const aceita = ['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type);
    if (escala === 1 && aceita && arquivo.size < 1024 * 1024) { img.close(); return arquivo; }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * escala);
    canvas.height = Math.round(img.height * escala);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; // fundo branco: PNG transparente não fica preto no JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.close();
    const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', 0.85));
    return blob ? new File([blob], 'foto.jpg', { type: 'image/jpeg' }) : arquivo;
  } catch {
    return arquivo;
  }
}
