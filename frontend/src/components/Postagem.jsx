import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { tempo, iconeCategoria } from '../util.js';
import Avatar from './Avatar.jsx';
import Icone from './Icone.jsx';

export default function Postagem({ post }) {
  const [curtiu, setCurtiu] = useState(post.curtiu);
  const [curtidas, setCurtidas] = useState(post.curtidas);

  async function curtir() {
    // Atualiza na tela na hora e confirma com o servidor
    setCurtiu(!curtiu);
    setCurtidas((n) => n + (curtiu ? -1 : 1));
    try {
      const r = await api(`/postagens/${post.id_postagem}/curtir`, { method: 'POST' });
      setCurtiu(r.curtiu);
      setCurtidas(r.curtidas);
    } catch {
      setCurtiu(curtiu);
      setCurtidas(post.curtidas);
    }
  }

  return (
    <article className="card post">
      <div className="post-topo">
        <Link to={`/perfil/${post.id_usuario}`}><Avatar nome={post.nome} /></Link>
        <div className="post-autor">
          <Link to={`/perfil/${post.id_usuario}`}><strong>{post.nome}</strong></Link>
          <span>@{post.usuario} · {tempo(post.data_postagem)}</span>
        </div>
        {post.pontos_gerados > 0 && <span className="pts-chip">+{post.pontos_gerados}</span>}
      </div>
      <div className="categoria"><Icone nome={iconeCategoria[post.categoria] || 'leaf'} tamanho={15} />{post.categoria}</div>
      <p className="post-texto">{post.conteudo}</p>
      {post.url_foto
        ? <img src={post.url_foto} alt="" style={{ borderRadius: 12 }} />
        : null}
      {post.patrocinador && (
        <div className="post-patrocinio"><Icone nome="award" tamanho={14} />Desafio patrocinado por <strong>{post.patrocinador}</strong></div>
      )}
      <div className="post-acoes">
        <button type="button" onClick={curtir} aria-pressed={curtiu} aria-label="Curtir">
          <Icone nome="heart" tamanho={19} fill={curtiu ? 'currentColor' : 'none'} />{curtidas}
        </button>
        <button type="button" aria-label="Comentários"><Icone nome="comment" tamanho={19} />{post.comentarios}</button>
        <button type="button" aria-label="Repostar"><Icone nome="repost" tamanho={19} /></button>
        <button type="button" aria-label="Compartilhar"><Icone nome="share" tamanho={19} /></button>
      </div>
    </article>
  );
}
