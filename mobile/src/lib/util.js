// Mesmas regras do front-end web (frontend/src/util.js)
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

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

export const diasAte = (data) => Math.max(0, Math.ceil((new Date(data) - new Date()) / 86400000));

// Mesmo limite do back-end (middleware/foto.js)
export const LIMITE_FOTO = 5 * 1024 * 1024;

// Foto de celular tem de 4 a 8 MB e no iPhone costuma vir em HEIC, que o back-end
// não aceita. Por isso toda foto é regravada em JPEG, com no máximo 1600 px no lado maior.
export async function reduzirFoto({ uri, width, height }, ladoMax = 1600) {
  const contexto = ImageManipulator.manipulate(uri);
  if (Math.max(width, height) > ladoMax) {
    contexto.resize(width >= height ? { width: ladoMax, height: null } : { width: null, height: ladoMax });
  }
  const imagem = await contexto.renderAsync();
  const salva = await imagem.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
  return { uri: salva.uri, width: salva.width, height: salva.height };
}

// Formata o CPF enquanto a pessoa digita: 000.000.000-00
export const mascaraCpf = (v) => v.replace(/\D/g, '').slice(0, 11)
  .replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');

// O @ só aceita o que o back-end aceita: minúsculas, números, ponto e _
export const limparUsuario = (v) => v.toLowerCase().replace(/[^a-z0-9._]/g, '');
