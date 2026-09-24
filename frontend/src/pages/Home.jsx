import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
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

  useEffect(() => {
    setPosts(null);
    api(`/postagens/feed?filtro=${filtro}`).then(setPosts).catch((e) => setErro(e.message));
  }, [filtro, ultimaPostagem]);

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
