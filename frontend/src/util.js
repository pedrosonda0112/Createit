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
