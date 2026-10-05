import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { fmt } from '../util.js';
import Avatar from '../components/Avatar.jsx';
import EditarUsuarioAdmin from '../components/EditarUsuarioAdmin.jsx';
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
  const fechar = useCallback(() => setEditando(null), []);

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
          <h1>Admin</h1>
        </div>
        <p className="texto-suave" style={{ fontSize: 14 }}>
          Edite ou apague contas aqui. Para apagar postagens, comentários ou curtidas, use a lixeira onde eles aparecem
          (no feed, no perfil ou na tela de comentários).
        </p>

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

      {editando && <EditarUsuarioAdmin alvo={editando} aoFechar={fechar} aoSalvar={salvo} aoApagar={apagado} />}
    </div>
  );
}
