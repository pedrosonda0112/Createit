import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { fmt } from '../util.js';
import Avatar from '../components/Avatar.jsx';
import Icone from '../components/Icone.jsx';
import Postagem from '../components/Postagem.jsx';

function Pessoa({ p }) {
  const [seguindo, setSeguindo] = useState(p.seguindo);
  async function seguir() {
    setSeguindo(!seguindo);
    const r = await api(`/usuarios/${p.id_usuario}/seguir`, { method: 'POST' }).catch(() => ({ seguindo }));
    setSeguindo(r.seguindo);
  }
  return (
    <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
      <Link to={`/perfil/${p.id_usuario}`}><Avatar nome={p.nome} tamanho={56} /></Link>
      <div>
        <Link to={`/perfil/${p.id_usuario}`} style={{ color: 'var(--texto)', fontWeight: 700 }}>{p.nome}</Link>
        <p className="texto-suave" style={{ fontSize: 12 }}>@{p.usuario}</p>
        <p className="pts" style={{ fontSize: 12 }}>{fmt(p.pontos_ecologicos)} pts</p>
      </div>
      <button className={`btn btn-pequeno btn-bloco ${seguindo ? 'btn-secundario' : 'btn-primario'}`} onClick={seguir}>
        {seguindo ? 'Seguindo' : 'Seguir'}
      </button>
    </div>
  );
}

export default function Buscar() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [texto, setTexto] = useState(q);
  const [filtro, setFiltro] = useState('tudo');
  const [res, setRes] = useState(null);

  useEffect(() => {
    setTexto(q);
    if (!q) { setRes(null); return; }
    api(`/busca?q=${encodeURIComponent(q)}`).then(setRes).catch(() => setRes({ pessoas: [], acoes: [], recompensas: [] }));
  }, [q]);

  const total = res ? res.pessoas.length + res.acoes.length + res.recompensas.length : 0;
  const mostra = (tipo) => filtro === 'tudo' || filtro === tipo;

  return (
    <div className="conteudo">
      <div className="coluna-principal">
        <h1 style={{ fontSize: 28 }}>Buscar</h1>
        <form className="busca-topo" style={{ flex: 'none', height: 56, borderColor: 'var(--gelo)', background: 'var(--superficie)' }}
          onSubmit={(e) => { e.preventDefault(); setParams(texto.trim() ? { q: texto.trim() } : {}); }} role="search">
          <Icone nome="search" tamanho={22} style={{ color: 'var(--gelo)' }} />
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar pessoas, ações ou recompensas" aria-label="Buscar" style={{ fontSize: 17 }} autoFocus />
          {texto && <button type="button" className="icone-btn" style={{ width: 32, height: 32 }} onClick={() => { setTexto(''); setParams({}); }} aria-label="Limpar"><Icone nome="x" tamanho={18} /></button>}
        </form>
        <div className="chips">
          {[['tudo', 'Tudo'], ['pessoas', 'Pessoas'], ['acoes', 'Ações'], ['recompensas', 'Recompensas']].map(([v, n]) => (
            <button key={v} className="chip" aria-pressed={filtro === v} onClick={() => setFiltro(v)}>{n}</button>
          ))}
        </div>

        {!q && <p className="vazio">Digite o nome de alguém, uma ação (como “bike”) ou uma recompensa.</p>}
        {res && <p className="texto-suave" style={{ fontSize: 14 }}>{total} resultado{total === 1 ? '' : 's'} para “{q}”</p>}

        {res && mostra('pessoas') && res.pessoas.length > 0 && (<>
          <h2 className="card-titulo">Pessoas</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {res.pessoas.map((p) => <Pessoa key={p.id_usuario} p={p} />)}
          </div>
        </>)}
        {res && mostra('acoes') && res.acoes.length > 0 && (<>
          <h2 className="card-titulo">Ações</h2>
          {res.acoes.map((p) => <Postagem key={p.id_postagem} post={p} />)}
        </>)}
        {res && mostra('recompensas') && res.recompensas.length > 0 && (<>
          <h2 className="card-titulo">Recompensas</h2>
          {res.recompensas.map((r) => (
            <Link to="/recompensas" key={r.id_recompensa} className="card" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center', color: 'var(--texto)' }}>
              <span className="avatar" style={{ width: 52, height: 52, borderRadius: 12, borderColor: 'var(--borda)' }}><Icone nome="gift" /></span>
              <span style={{ flex: 1 }}><small className="texto-suave">{r.patrocinador}</small><br /><strong>{r.titulo}</strong></span>
              <span className="pts">{fmt(r.custo_pontos)} pts</span>
            </Link>
          ))}
        </>)}
      </div>
    </div>
  );
}
