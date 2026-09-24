import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { tempo, iconeCategoria } from '../util.js';
import Avatar from './Avatar.jsx';
import Icone from './Icone.jsx';

export default function Postagem({ post, aoComentar, aoApagar }) {
  const { usuario, atualizar } = useAuth();
  const { avisar } = useOutletContext() ?? {};
  const [curtiu, setCurtiu] = useState(post.curtiu);
  const [curtidas, setCurtidas] = useState(post.curtidas);
  const [confirmando, setConfirmando] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [erroApagar, setErroApagar] = useState('');
  const [apagada, setApagada] = useState(false);
  const minha = post.id_usuario === usuario.id_usuario;
  const pontos = post.status_validacao === 'validada' ? post.pontos_gerados : 0;

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

  async function apagar() {
    setErroApagar('');
    setApagando(true);
    try {
      const saldo = await api(`/postagens/${post.id_postagem}`, { method: 'DELETE' });
      atualizar(saldo);
      avisar?.(pontos > 0 ? `Ação apagada. −${pontos} pts no seu saldo.` : 'Ação apagada.');
      // Quem mostra a lista pode tirar a postagem dela; senão, o card só some
      if (aoApagar) aoApagar(post.id_postagem);
      else setApagada(true);
    } catch (err) {
      setErroApagar(err.message);
      setApagando(false);
    }
  }

  function cancelar() {
    setConfirmando(false);
    setErroApagar('');
  }

  if (apagada) return null;

  return (
    <article className="card post">
      <div className="post-topo">
        <Link to={`/perfil/${post.id_usuario}`}><Avatar nome={post.nome} /></Link>
        <div className="post-autor">
          <Link to={`/perfil/${post.id_usuario}`}><strong>{post.nome}</strong></Link>
          <span>@{post.usuario} · {tempo(post.data_postagem)}</span>
        </div>
        {post.pontos_gerados > 0 && <span className="pts-chip">+{post.pontos_gerados}</span>}
        {minha && !confirmando && (
          <button type="button" className="icone-btn post-apagar" onClick={() => setConfirmando(true)} aria-label="Apagar ação">
            <Icone nome="lixeira" tamanho={18} />
          </button>
        )}
      </div>
      {confirmando && (
        <div className="post-confirmar" role="group" aria-label="Confirmar exclusão">
          <p>
            <strong>Apagar esta ação?</strong>{' '}
            {pontos > 0 && `Os ${pontos} pts que ela deu saem do seu saldo. `}
            Curtidas e comentários também são apagados.
          </p>
          {erroApagar && <p className="erro" role="alert">{erroApagar}</p>}
          <div className="post-confirmar-botoes">
            <button type="button" className="btn btn-secundario btn-pequeno" onClick={cancelar} autoFocus>Cancelar</button>
            <button type="button" className="btn btn-perigo btn-pequeno" onClick={apagar} disabled={apagando}>
              {apagando ? 'Apagando…' : 'APAGAR'}
            </button>
          </div>
        </div>
      )}
      <div className="categoria"><Icone nome={iconeCategoria[post.categoria] || 'leaf'} tamanho={15} />{post.categoria}</div>
      <p className="post-texto">{post.conteudo}</p>
      {post.url_foto && <img className="post-foto" src={post.url_foto} alt={`Foto da ação de ${post.nome}`} loading="lazy" />}
      {post.patrocinador && (
        <div className="post-patrocinio"><Icone nome="award" tamanho={14} />Desafio patrocinado por <strong>{post.patrocinador}</strong></div>
      )}
      <div className="post-acoes">
        <button type="button" onClick={curtir} aria-pressed={curtiu} aria-label="Curtir">
          <Icone nome="heart" tamanho={19} fill={curtiu ? 'currentColor' : 'none'} />{curtidas}
        </button>
        {/* Na tela de comentários o botão só leva ao campo; no feed, abre a tela */}
        {aoComentar
          ? <button type="button" onClick={aoComentar} aria-label="Comentar"><Icone nome="comment" tamanho={19} />{post.comentarios}</button>
          : <Link to={`/postagem/${post.id_postagem}`} aria-label="Ver comentários"><Icone nome="comment" tamanho={19} />{post.comentarios}</Link>}
        <button type="button" aria-label="Repostar"><Icone nome="repost" tamanho={19} /></button>
        <button type="button" aria-label="Compartilhar"><Icone nome="share" tamanho={19} /></button>
      </div>
    </article>
  );
}
