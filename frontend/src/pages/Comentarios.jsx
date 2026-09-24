import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { tempo } from '../util.js';
import Avatar from '../components/Avatar.jsx';
import Icone from '../components/Icone.jsx';
import Postagem from '../components/Postagem.jsx';

// Tela de uma postagem com os comentários (mais recentes primeiro, logo abaixo do campo)
export default function Comentarios() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const { avisar } = useOutletContext();
  const navegar = useNavigate();
  const local = useLocation();
  const [post, setPost] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [erro, setErro] = useState('');
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const campo = useRef(null);

  useEffect(() => {
    setPost(null);
    setErro('');
    Promise.all([api(`/postagens/${id}`), api(`/postagens/${id}/comentarios`)])
      .then(([p, c]) => { setPost(p); setComentarios(c); })
      .catch((e) => setErro(e.message));
  }, [id]);

  // Veio de outra tela do app: volta para ela. Abriu o link direto: vai para o feed.
  const voltar = () => (local.key !== 'default' ? navegar(-1) : navegar('/'));

  async function comentar(e) {
    e.preventDefault();
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    try {
      const novo = await api(`/postagens/${id}/comentarios`, { method: 'POST', body: { texto } });
      setComentarios((lista) => [novo, ...lista]);
      setPost((p) => ({ ...p, comentarios: p.comentarios + 1 }));
      setTexto('');
    } catch (err) {
      avisar(err.message);
    } finally {
      setEnviando(false);
    }
  }

  // Enter envia; Shift+Enter quebra a linha
  function teclou(e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      e.currentTarget.form.requestSubmit();
    }
  }

  return (
    <div className="conteudo">
      <div className="coluna-principal">
        <div className="cabecalho-pagina" style={{ justifyContent: 'flex-start', gap: 8 }}>
          <button className="icone-btn" onClick={voltar} aria-label="Voltar"><Icone nome="voltar" tamanho={22} /></button>
          <h1>Comentários</h1>
        </div>

        {erro && <p className="vazio">{erro} <Link to="/">Voltar para o feed</Link></p>}
        {!post && !erro && <p className="vazio">Carregando…</p>}

        {post && (<>
          <Postagem post={post} aoComentar={() => campo.current?.focus()} aoApagar={voltar} />

          <form className="card comentar" onSubmit={comentar}>
            <Avatar nome={usuario.nome} tamanho={36} />
            <textarea ref={campo} value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={teclou}
              placeholder="Escreva um comentário" aria-label="Seu comentário" maxLength={500} rows={1} />
            <button className="btn btn-primario btn-pequeno" disabled={enviando || !texto.trim()}>
              {enviando ? 'Enviando…' : 'COMENTAR'}
            </button>
          </form>

          <section className="card lista-comentarios" aria-label="Comentários">
            {comentarios.length === 0 && <p className="vazio">Ninguém comentou ainda. Seja a primeira pessoa.</p>}
            {comentarios.map((c) => (
              <article className="comentario" key={c.id_comentario}>
                <Link to={`/perfil/${c.id_usuario}`}><Avatar nome={c.nome} tamanho={36} /></Link>
                <div className="comentario-corpo">
                  <div className="comentario-topo">
                    <Link to={`/perfil/${c.id_usuario}`}><strong>{c.nome}</strong></Link>
                    <span>@{c.usuario} · {tempo(c.data_comentario)}</span>
                  </div>
                  <p>{c.texto}</p>
                </div>
              </article>
            ))}
          </section>
        </>)}
      </div>
    </div>
  );
}
