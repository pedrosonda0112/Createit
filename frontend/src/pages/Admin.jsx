import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { fmt } from '../util.js';
import Avatar from '../components/Avatar.jsx';
import EditarUsuarioAdmin from '../components/EditarUsuarioAdmin.jsx';
import NovoPatrocinador from '../components/NovoPatrocinador.jsx';
import Icone from '../components/Icone.jsx';

// Painel de administração: buscar e editar/apagar contas.
// Postagens, comentários e curtidas se moderam onde aparecem (lixeira no card e na tela de comentários).
export default function Admin() {
  const { usuario } = useAuth();
  const { avisar } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [texto, setTexto] = useState(q);
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState('');
  const [editando, setEditando] = useState(null);
  const [patrocinadores, setPatrocinadores] = useState([]);
  const [criandoEmpresa, setCriandoEmpresa] = useState(false);
  const fechar = useCallback(() => setEditando(null), []);
  const fecharEmpresa = useCallback(() => setCriandoEmpresa(false), []);

  useEffect(() => {
    if (usuario.admin) api('/admin/patrocinadores').then(setPatrocinadores).catch(() => {});
  }, [usuario.admin]);

  useEffect(() => {
    if (!usuario.admin) return;
    setTexto(q);
    setLista(null);
    setErro('');
    api(`/admin/usuarios?q=${encodeURIComponent(q)}`).then(setLista).catch((e) => setErro(e.message));
  }, [q, usuario.admin]);

  if (!usuario.admin) return <Navigate to="/" replace />;

  function salvo(u) {
    setLista((l) => l.map((x) => (x.id_usuario === u.id_usuario ? { ...x, ...u } : x)));
    api('/admin/patrocinadores').then(setPatrocinadores).catch(() => {});
    setEditando(null);
    avisar(`@${u.usuario} atualizado.`);
  }

  function apagado(u) {
    setLista((l) => l.filter((x) => x.id_usuario !== u.id_usuario));
    setEditando(null);
    avisar(`Conta de @${u.usuario} apagada.`);
  }

  return (
    <div className="conteudo">
      <div className="coluna-principal">
        <div className="cabecalho-pagina">
          <div><small className="sobretitulo">Administração</small><h1>Visão geral da comunidade</h1></div>
        </div>
        <p className="texto-suave" style={{ fontSize: 14 }}>
          Edite ou apague contas aqui. Para apagar postagens, comentários ou curtidas, use a lixeira onde eles aparecem
          (no feed, no perfil ou na tela de comentários).
        </p>

        {lista && <section className="impacto-grade" aria-label="Resumo das contas listadas">
          <div><Icone nome="users" /><strong>{fmt(lista.length)}</strong><small>Contas listadas</small></div>
          <div><Icone nome="leaf" /><strong>{fmt(lista.reduce((total, u) => total + Number(u.postagens || 0), 0))}</strong><small>Postagens dessas contas</small></div>
        </section>}
        <form className="busca-topo" style={{ flex: 'none', height: 52, background: 'var(--superficie)' }}
          onSubmit={(e) => { e.preventDefault(); setParams(texto.trim() ? { q: texto.trim() } : {}); }} role="search">
          <Icone nome="search" tamanho={20} />
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nome, @usuário ou e-mail" aria-label="Buscar contas" />
          {texto && <button type="button" className="icone-btn" style={{ width: 32, height: 32 }} onClick={() => { setTexto(''); setParams({}); }} aria-label="Limpar"><Icone nome="x" tamanho={18} /></button>}
        </form>

        {erro && <p className="erro">{erro}</p>}
        {lista === null && !erro && <p className="vazio">Carregando…</p>}
        {lista?.length === 0 && <p className="vazio">Nenhuma conta encontrada.</p>}
        {lista && lista.length > 0 && (
          <section className="card admin-lista" aria-label="Contas">
            {lista.map((u) => (
              <div className="admin-linha" key={u.id_usuario}>
                <Link to={`/perfil/${u.id_usuario}`}><Avatar nome={u.nome} tamanho={40} /></Link>
                <div className="admin-linha-corpo">
                  <div className="admin-linha-nome">
                    <Link to={`/perfil/${u.id_usuario}`}><strong>{u.nome}</strong></Link>
                    {u.admin && <span className="selo-admin"><Icone nome="escudo" tamanho={12} />Admin</span>}
                    {u.patrocinador && <span className="selo-patrocinador"><Icone nome="loja" tamanho={12} />{u.patrocinador}</span>}
                  </div>
                  <small className="texto-suave">@{u.usuario} · {u.email}</small>
                  <small className="texto-suave">{fmt(u.pontos_ecologicos)} pts · nível {u.nivel} · {u.postagens} {u.postagens === 1 ? 'postagem' : 'postagens'}</small>
                </div>
                <button type="button" className="btn btn-secundario btn-pequeno" onClick={() => setEditando(u)}>
                  <Icone nome="edit" tamanho={16} />Editar
                </button>
              </div>
            ))}
          </section>
        )}
      </div>

      <aside className="coluna-lateral">
        <section className="card lista-card admin-empresas">
          <div className="linha-entre">
            <h2 className="card-titulo">Empresas parceiras</h2>
            <button type="button" className="btn btn-secundario btn-pequeno" onClick={() => setCriandoEmpresa(true)}><Icone nome="plus" tamanho={16} />Nova</button>
          </div>
          {patrocinadores.length === 0 && <p className="texto-suave" style={{ fontSize: 13 }}>Nenhuma empresa cadastrada.</p>}
          {patrocinadores.map((p) => (
            <div key={p.id_patrocinador} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Icone nome="loja" />
              <div style={{ lineHeight: 1.35 }}>
                <strong style={{ fontSize: 13 }}>{p.razao_social}</strong><br />
                <small className="texto-suave">{p.localizacao || 'Sem localização'} · {p.contas} {Number(p.contas) === 1 ? 'conta' : 'contas'}</small>
              </div>
            </div>
          ))}
          <p className="texto-suave" style={{ fontSize: 12 }}>Para dar acesso a uma empresa, edite a conta da pessoa e escolha a empresa em "Conta de patrocinador".</p>
        </section>
      </aside>

      {editando && <EditarUsuarioAdmin alvo={editando} patrocinadores={patrocinadores} aoFechar={fechar} aoSalvar={salvo} aoApagar={apagado} />}
      {criandoEmpresa && <NovoPatrocinador aoFechar={fecharEmpresa}
        aoSalvar={(p) => { setPatrocinadores((l) => [...l, p].sort((a, b) => a.razao_social.localeCompare(b.razao_social))); setCriandoEmpresa(false); avisar(`${p.razao_social} cadastrada.`); }} />}
    </div>
  );
}
