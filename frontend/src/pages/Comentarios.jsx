import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useAoVivo } from '../aoVivo.js';
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
  // Moderação: quem curtiu (só admin vê) e qual comentário está pedindo confirmação para apagar
  const [curtidas, setCurtidas] = useState(null);
  const [apagando, setApagando] = useState(null);
  const campo = useRef(null);

  const buscarCurtidas = () => api(`/postagens/${id}/curtidas`).then(setCurtidas).catch(() => {});

  useEffect(() => {
    setPost(null);
    setErro('');
    setCurtidas(null);
    Promise.all([api(`/postagens/${id}`), api(`/postagens/${id}/comentarios`)])
      .then(([p, c]) => { setPost(p); setComentarios(c); })
      .catch((e) => setErro(e.message));
    if (usuario.admin) buscarCurtidas();
  }, [id, usuario.admin]);

  // Comentário novo de outra pessoa: busca a lista de novo pela API (o aviso só traz o id)
  useAoVivo((evento, dados) => {
    if (dados.id_postagem !== Number(id)) return;
    if (evento === 'novo_comentario' && !comentarios.some((c) => c.id_comentario === dados.id_comentario)) {
      api(`/postagens/${id}/comentarios`).then(setComentarios).catch(() => {});
    } else if (evento === 'comentario_apagado') {
      setComentarios((lista) => lista.filter((c) => c.id_comentario !== dados.id_comentario));
    } else if (evento === 'contadores' && curtidas && curtidas.length !== dados.curtidas) {
      buscarCurtidas();
    } else if (evento === 'postagem_apagada') {
      setPost(null);
      setErro('Essa postagem foi apagada.');
    }
  });

  // O autor apaga o próprio comentário; admin apaga qualquer um
  async function apagarComentario(c) {
    try {
      const r = await api(`/postagens/${id}/comentarios/${c.id_comentario}`, { method: 'DELETE' });
      setComentarios((lista) => lista.filter((x) => x.id_comentario !== c.id_comentario));
      setPost((p) => p && { ...p, comentarios: r.comentarios });
      avisar('Comentário apagado.');
    } catch (err) {
      avisar(err.message);
    } finally {
      setApagando(null);
    }
  }

  async function tirarCurtida(u) {
    try {
      const r = await api(`/postagens/${id}/curtidas/${u.id_usuario}`, { method: 'DELETE' });
      setCurtidas((lista) => lista.filter((x) => x.id_usuario !== u.id_usuario));
      setPost((p) => p && { ...p, curtidas: r.curtidas, curtiu: u.id_usuario === usuario.id_usuario ? false : p.curtiu });
      avisar(`Curtida de @${u.usuario} removida.`);
    } catch (err) {
      avisar(err.message);
    }
  }

  // Veio de outra tela do app: volta para ela. Abriu o link direto: vai para o feed.
  const voltar = () => (local.key !== 'default' ? navegar(-1) : navegar('/'));

  async function comentar(e) {
    e.preventDefault();
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    try {
      const novo = await api(`/postagens/${id}/comentarios`, { method: 'POST', body: { texto } });
      // O aviso ao vivo pode ter trazido o comentário antes da resposta
      setComentarios((lista) => (lista.some((c) => c.id_comentario === novo.id_comentario) ? lista : [novo, ...lista]));
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
                  {apagando === c.id_comentario && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button type="button" className="btn btn-secundario btn-pequeno" onClick={() => setApagando(null)} autoFocus>Cancelar</button>
                      <button type="button" className="btn btn-perigo btn-pequeno" onClick={() => apagarComentario(c)}>APAGAR</button>
                    </div>
                  )}
                </div>
                {(c.id_usuario === usuario.id_usuario || usuario.admin) && apagando !== c.id_comentario && (
                  <button type="button" className="icone-btn comentario-apagar" onClick={() => setApagando(c.id_comentario)} aria-label="Apagar comentário">
                    <Icone nome="lixeira" tamanho={16} />
                  </button>
                )}
              </article>
            ))}
          </section>

          {/* Só admin: quem curtiu, com a opção de tirar a curtida */}
          {usuario.admin && curtidas && curtidas.length > 0 && (
            <section className="card lista-curtidas" aria-label="Curtidas">
              <h2>Curtidas</h2>
              {curtidas.map((u) => (
                <div className="comentario" key={u.id_usuario} style={{ alignItems: 'center' }}>
                  <Link to={`/perfil/${u.id_usuario}`}><Avatar nome={u.nome} tamanho={32} /></Link>
                  <div className="comentario-corpo">
                    <div className="comentario-topo">
                      <Link to={`/perfil/${u.id_usuario}`}><strong>{u.nome}</strong></Link>
                      <span>@{u.usuario} · {tempo(u.data_curtida)}</span>
                    </div>
                  </div>
                  <button type="button" className="icone-btn comentario-apagar" style={{ alignSelf: 'center' }} onClick={() => tirarCurtida(u)} aria-label={`Tirar a curtida de @${u.usuario}`}>
                    <Icone nome="x" tamanho={16} />
                  </button>
                </div>
              ))}
            </section>
          )}
        </>)}
      </div>
    </div>
  );
}
