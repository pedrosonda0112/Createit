// Tempo real: um único canal público ("feed") no Supabase Realtime, alimentado pelos
// triggers do database/06_tempo_real.sql. O canal só traz ids e totais; o resto vem
// da API, com login, como sempre. A chave publishable é pública por natureza e não
// dá acesso ao banco (anon não enxerga o schema createit).
// Sem VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY o app funciona normalmente,
// só não se atualiza sozinho.
import { useEffect, useRef } from 'react';
import { RealtimeClient } from '@supabase/realtime-js';

const URL_BASE = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const CHAVE = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const ouvintes = new Set();
let canal = null;

// Uma conexão para o app inteiro, aberta na primeira tela que precisar
function conectar() {
  if (canal || !URL_BASE || !CHAVE) return;
  const cliente = new RealtimeClient(`${URL_BASE}/realtime/v1`, { params: { apikey: CHAVE } });
  canal = cliente
    .channel('feed')
    .on('broadcast', { event: '*' }, ({ event, payload }) => ouvintes.forEach((f) => f(event, payload)))
    .subscribe();
}

// Chama aoReceber(evento, dados) a cada aviso enquanto o componente estiver na tela.
// Eventos: nova_postagem, postagem_apagada, novo_comentario, contadores.
export function useAoVivo(aoReceber) {
  const atual = useRef(aoReceber);
  atual.current = aoReceber;
  useEffect(() => {
    conectar();
    const ouvinte = (evento, dados) => atual.current(evento, dados);
    ouvintes.add(ouvinte);
    return () => ouvintes.delete(ouvinte);
  }, []);
}
