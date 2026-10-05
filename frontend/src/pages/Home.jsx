import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useAoVivo } from '../aoVivo.js';
import Avatar from '../components/Avatar.jsx';
import Icone from '../components/Icone.jsx';
import Postagem from '../components/Postagem.jsx';
import { CardPrimeiroDesafio, CardRanking, CardSaldo } from '../components/Laterais.jsx';

export default function Home() {
  const { usuario } = useAuth();
  const { abrirRegistro, ultimaPostagem } = useOutletContext();
  const [filtro, setFiltro] = useState('seguindo');
  const [posts, setPosts] = useState(null);
  const [erro, setErro] = useState('');
  // Feed novo já buscado, esperando a pessoa tocar em "novas postagens"
  const [novo, setNovo] = useState(null);
  const espera = useRef(null);

  useEffect(() => {
    setPosts(null);
    setNovo(null);
    api(`/postagens/feed?filtro=${filtro}`).then(setPosts).catch((e) => setErro(e.message));
  }, [filtro, ultimaPostagem]);

  useEffect(() => () => clearTimeout(espera.current), []);

  // Alguém postou: a API diz se entra no meu feed (sigo a pessoa?). A lista não pula
  // sozinha embaixo de quem está lendo; aparece o botão. Só no "Seguindo": no
  // "Em alta" uma postagem nova (sem curtidas) não sobe para o topo.
  // As minhas já entram pelo ultimaPostagem.
  useAoVivo((evento, dados) => {
    if (evento !== 'nova_postagem' || filtro !== 'seguindo' || dados.id_usuario === usuario.id_usuario) return;
    // Várias postagens seguidas viram uma busca só
    clearTimeout(espera.current);
    espera.current = setTimeout(() => {
      api('/postagens/feed?filtro=seguindo').then((lista) => setNovo({ filtro: 'seguindo', lista })).catch(() => {});
    }, 800);
  });

  const qtdNovas = novo?.filtro === filtro && posts
    ? novo.lista.filter((p) => !posts.some((x) => x.id_postagem === p.id_postagem)).length
    : 0;

  function mostrarNovas() {
    setPosts(novo.lista);
    setNovo(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="conteudo">
      <div className="coluna-principal">
        <div className="cabecalho-pagina">
          <h1>Feed</h1>
          <div className="chips">
            <button className="chip" aria-pressed={filtro === 'seguindo'} onClick={() => setFiltro('seguindo')}>Seguindo</button>
            <button className="chip" aria-pressed={filtro === 'alta'} onClick={() => setFiltro('alta')}>Em alta</button>
          </div>
        </div>

        <div className="card nova-acao">
          <Avatar nome={usuario.nome} tamanho={44} />
          <button className="falso-campo" onClick={abrirRegistro}>Que ação sustentável você fez hoje?</button>
          <button className="icone-btn" onClick={abrirRegistro} aria-label="Adicionar foto"><Icone nome="camera" tamanho={22} /></button>
          <button className="btn btn-primario" onClick={abrirRegistro}>REGISTRAR</button>
        </div>

        {qtdNovas > 0 && (
          <button type="button" className="novas-postagens" onClick={mostrarNovas}>
            <Icone nome="seta-cima" tamanho={16} />
            {qtdNovas === 1 ? '1 nova postagem' : `${qtdNovas} novas postagens`}
          </button>
        )}

        {erro && <p className="erro">{erro}</p>}
        {posts === null && !erro && <p className="vazio">Carregando o feed…</p>}
        {posts?.length === 0 && (
          <p className="vazio">Nada por aqui ainda. Siga outras pessoas pela busca ou registre sua primeira ação.</p>
        )}
        {posts?.map((p) => <Postagem key={p.id_postagem} post={p} />)}
      </div>

      <aside className="coluna-lateral">
        <CardSaldo />
        <CardPrimeiroDesafio />
        <CardRanking />
      </aside>
    </div>
  );
}
