import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { fmt, iconeCategoria, nomeNivel, PONTOS_POR_NIVEL, tempo } from '../util.js';
import Avatar from '../components/Avatar.jsx';
import Icone from '../components/Icone.jsx';
import Postagem from '../components/Postagem.jsx';

const iconeConquista = { 'Primeira ação': 'leaf', Reciclador: 'recycle', 'Sem carro': 'bus', 'Poupa água': 'drop', 'Energia limpa': 'bolt' };

export default function Perfil() {
  const { usuario } = useAuth();
  const { ultimaPostagem, avisar } = useOutletContext();
  const { id } = useParams();
  const idPerfil = Number(id || usuario.id_usuario);
  const meu = idPerfil === usuario.id_usuario;
  const [p, setP] = useState(null);
  const [aba, setAba] = useState('acoes');

  useEffect(() => { setP(null); api(`/usuarios/${idPerfil}`).then(setP).catch((e) => avisar(e.message)); }, [idPerfil, ultimaPostagem, usuario.pontos_ecologicos, avisar]);

  async function seguir() {
    const r = await api(`/usuarios/${idPerfil}/seguir`, { method: 'POST' });
    setP({ ...p, eu_sigo: r.seguindo, seguidores: p.seguidores + (r.seguindo ? 1 : -1) });
  }

  if (!p) return <div className="conteudo"><p className="vazio">Carregando perfil…</p></div>;

  const inicioNivel = (p.nivel - 1) * PONTOS_POR_NIVEL;
  const fimNivel = p.nivel * PONTOS_POR_NIVEL;
  const pct = Math.max(0, Math.min(100, ((p.pontos_ecologicos - inicioNivel) / PONTOS_POR_NIVEL) * 100));
  const maxImpacto = Math.max(1, ...p.impacto.map((i) => i.acoes));

  return (
    <div className="conteudo">
      <div className="coluna-principal">
        <section className="card" style={{ overflow: 'hidden' }}>
          <div style={{ height: 96, background: 'var(--gelo)' }} />
          <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -48, gap: 12, flexWrap: 'wrap' }}>
              <span style={{ borderRadius: '50%', boxShadow: '0 0 0 4px var(--superficie)' }}><Avatar nome={p.nome} tamanho={96} /></span>
              {meu
                ? <button className="btn btn-primario btn-pequeno" onClick={() => avisar('Edição de perfil chega na próxima versão.')}><Icone nome="edit" tamanho={16} />Editar perfil</button>
                : <button className={`btn btn-pequeno ${p.eu_sigo ? 'btn-secundario' : 'btn-primario'}`} onClick={seguir}>{p.eu_sigo ? 'Seguindo' : 'Seguir'}</button>}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 24 }}>{p.nome}</h1>
                <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', background: 'var(--superficie-2)', color: 'var(--gelo)', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                  <Icone nome="star" tamanho={14} />Nível {p.nivel} · {nomeNivel(p.nivel)}
                </span>
              </div>
              <p className="texto-suave" style={{ fontSize: 14, display: 'flex', gap: 6, alignItems: 'center' }}>@{p.usuario}{p.cidade && <> · <Icone nome="pin" tamanho={14} />{p.cidade}</>}</p>
            </div>
            {p.bio && <p>{p.bio}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid var(--borda)', paddingTop: 16, textAlign: 'center' }}>
              {[[fmt(p.pontos_ecologicos), 'pontos'], [p.acoes, 'ações'], [p.seguidores, 'seguidores'], [p.seguindo, 'seguindo']].map(([n, l]) => (
                <div key={l}><strong style={{ fontFamily: 'var(--fonte-titulo)', fontWeight: 900, fontSize: 22 }}>{n}</strong><br /><small className="texto-suave">{l}</small></div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="linha-entre"><strong>Próximo nível: {p.nivel + 1} · {nomeNivel(p.nivel + 1)}</strong><span className="texto-suave">{fmt(p.pontos_ecologicos)} / {fmt(fimNivel)}</span></div>
              <div className="barra" style={{ height: 10 }}><span style={{ width: `${pct}%` }} /></div>
            </div>
          </div>
        </section>

        <div className="chips">
          <button className="chip" aria-pressed={aba === 'acoes'} onClick={() => setAba('acoes')}>{meu ? 'Minhas ações' : 'Ações'}</button>
          <button className="chip" aria-pressed={aba === 'conquistas'} onClick={() => setAba('conquistas')}>Conquistas</button>
        </div>
        {aba === 'acoes' && (p.postagens.length ? p.postagens.map((x) => <Postagem key={x.id_postagem} post={x} />) : <p className="vazio">Nenhuma ação registrada ainda.</p>)}
        {aba === 'conquistas' && p.conquistas.map((c) => (
          <div key={c.id_conquista} className="card" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center', opacity: c.data_obtencao ? 1 : 0.6 }}>
            <span className="avatar" style={{ width: 44, height: 44, borderColor: c.data_obtencao ? 'var(--gelo)' : 'var(--borda)', color: c.data_obtencao ? 'var(--gelo)' : 'var(--texto-suave)' }}><Icone nome={iconeConquista[c.nome] || 'award'} /></span>
            <div style={{ flex: 1 }}><strong>{c.nome}</strong><br /><small className="texto-suave">{c.descricao}</small></div>
            <small className="texto-suave">{c.data_obtencao ? 'Liberada' : 'Bloqueada'}</small>
          </div>
        ))}
      </div>

      <aside className="coluna-lateral">
        <section className="card lista-card">
          <h2 className="card-titulo">Conquistas</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {p.conquistas.map((c) => (
              <div key={c.id_conquista} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }} title={c.descricao}>
                <span className="avatar" style={{ width: 52, height: 52, borderWidth: 2, borderColor: c.data_obtencao ? 'var(--gelo)' : 'var(--borda)', color: c.data_obtencao ? 'var(--gelo)' : 'var(--texto-suave)' }}>
                  <Icone nome={iconeConquista[c.nome] || 'award'} tamanho={22} />
                </span>
                <small style={{ fontSize: 11, color: c.data_obtencao ? 'var(--texto)' : 'var(--texto-suave)' }}>{c.nome}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="card lista-card">
          <h2 className="card-titulo">Impacto</h2>
          {p.impacto.length === 0 && <p className="texto-suave" style={{ fontSize: 13 }}>As ações validadas aparecem aqui por categoria.</p>}
          {p.impacto.map((i) => (
            <div key={i.categoria} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="linha-entre"><span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icone nome={iconeCategoria[i.categoria] || 'leaf'} tamanho={16} style={{ color: 'var(--gelo)' }} />{i.categoria}</span><strong style={{ color: 'var(--gelo)' }}>{i.acoes} {i.acoes === 1 ? 'ação' : 'ações'}</strong></div>
              <div className="barra"><span style={{ width: `${(i.acoes / maxImpacto) * 100}%` }} /></div>
            </div>
          ))}
        </section>
        {meu && (
          <section className="card lista-card">
            <h2 className="card-titulo">Histórico de pontos</h2>
            {p.historico.map((h, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span className="avatar" style={{ width: 34, height: 34, borderRadius: 10, borderColor: 'var(--superficie-2)' }}><Icone nome={h.tipo === 'resgate' ? 'gift' : 'leaf'} tamanho={17} /></span>
                <div style={{ flex: 1, minWidth: 0, lineHeight: 1.35 }}>
                  <div style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.tipo === 'resgate' ? `Resgate: ${h.descricao}` : h.descricao}</div>
                  <small className="texto-suave">{tempo(h.data)}</small>
                </div>
                <span className="pts" style={{ fontSize: 13, color: h.pontos < 0 ? 'var(--texto-suave)' : 'var(--gelo)' }}>{h.pontos > 0 ? '+' : '−'}{fmt(Math.abs(h.pontos))}</span>
              </div>
            ))}
          </section>
        )}
      </aside>
    </div>
  );
}
