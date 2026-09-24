import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { fmt, PONTOS_POR_NIVEL } from '../util.js';
import Avatar from './Avatar.jsx';
import Icone from './Icone.jsx';

export function CardSaldo() {
  const { usuario } = useAuth();
  const proximo = usuario.nivel * PONTOS_POR_NIVEL;
  const falta = Math.max(0, proximo - usuario.pontos_ecologicos);
  return (
    <div className="saldo">
      <div>
        <small style={{ fontWeight: 700, fontSize: 13 }}>Seu saldo</small>
        <strong>{fmt(usuario.pontos_ecologicos)} pts</strong>
        <small>{falta > 0 ? `Faltam ${fmt(falta)} para o nível ${usuario.nivel + 1}` : `Nível ${usuario.nivel}`}</small>
      </div>
      <img src="/carpas.png" alt="" />
    </div>
  );
}

export function CardRanking() {
  const { usuario } = useAuth();
  const [lista, setLista] = useState([]);
  useEffect(() => { api('/ranking').then((r) => setLista(r.slice(0, 5))).catch(() => {}); }, [usuario.pontos_ecologicos]);
  return (
    <section className="card lista-card" aria-label="Ranking da semana">
      <h2 className="card-titulo">Ranking</h2>
      {lista.map((u) => (
        <div className="ranking-linha" key={u.id_usuario}>
          <span className={`pos ${u.posicao === 1 ? 'primeiro' : ''}`}>{u.posicao}</span>
          <Avatar nome={u.nome} tamanho={36} />
          <span className="nome">{u.id_usuario === usuario.id_usuario ? 'Você' : u.nome}</span>
          <span className="pts" style={{ fontSize: 13 }}>{fmt(u.pontos_ecologicos)} pts</span>
        </div>
      ))}
    </section>
  );
}

export function CardDesafio({ desafio }) {
  const pct = Math.min(100, (desafio.progresso / desafio.meta_acoes) * 100);
  return (
    <section className="card desafio-card">
      <div className="selo"><Icone nome="award" tamanho={18} />{desafio.patrocinador ? `Desafio ${desafio.patrocinador}` : 'Desafio da comunidade'}</div>
      <h3>{desafio.titulo}</h3>
      <div className="linha-entre">
        <span className="texto-suave">{desafio.progresso} de {desafio.meta_acoes} ações</span>
        <span style={{ color: 'var(--gelo)', fontWeight: 700 }}>+{desafio.pontos_bonus} pts bônus</span>
      </div>
      <div className="barra"><span style={{ width: `${pct}%` }} /></div>
    </section>
  );
}

export function CardPrimeiroDesafio() {
  const [d, setD] = useState(null);
  useEffect(() => { api('/desafios').then((l) => setD(l[0] || null)).catch(() => {}); }, []);
  return d ? <CardDesafio desafio={d} /> : null;
}
