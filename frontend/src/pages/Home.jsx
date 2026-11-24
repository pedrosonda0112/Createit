import { useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useAoVivo } from '../aoVivo.js';
import Avatar from '../components/Avatar.jsx';
import Icone from '../components/Icone.jsx';
import Postagem from '../components/Postagem.jsx';
import { CardImpacto, CardPrimeiroDesafio, CardRanking, CardSaldo } from '../components/Laterais.jsx';

const POR_PAGINA = 30;
const ABAS = [['todas', 'Todas'], ['seguindo', 'Seguindo'], ['alta', 'Em alta']];
const VAZIO = {
  todas: 'Ninguém publicou ainda. Registre a primeira ação da comunidade!',
  seguindo: 'Você ainda não segue ninguém. Encontre pessoas em Explorar ou veja a aba Todas.',
  alta: 'Nenhuma postagem curtida nos últimos 7 dias.',
};

export default function Home() {
  const { usuario } = useAuth();
  const { abrirRegistro, ultimaPostagem } = useOutletContext();
  const [filtro, setFiltro] = useState('todas');
  const [posts, setPosts] = useState(null);
  const [erro, setErro] = useState('');
  // A API manda 30 por vez: se veio a página cheia, pode haver mais
  const [temMais, setTemMais] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);
  // Feed novo já buscado, esperando a pessoa tocar em "novas postagens"
  const [novo, setNovo] = useState(null);
  const espera = useRef(null);

  useEffect(() => {
    setPosts(null);
    setNovo(null);
    setErro('');
    api(`/postagens/feed?filtro=${filtro}`)
      .then((lista) => { setPosts(lista); setTemMais(filtro !== 'alta' && lista.length === POR_PAGINA); })
      .catch((e) => setErro(e.message));
  }, [filtro, ultimaPostagem]);

  async function carregarMais() {
    const ultima = posts[posts.length - 1];
    setCarregandoMais(true);
    try {
      const mais = await api(`/postagens/feed?filtro=${filtro}&antes=${ultima.id_postagem}`);
      setPosts((l) => [...l, ...mais.filter((p) => !l.some((x) => x.id_postagem === p.id_postagem))]);
      setTemMais(mais.length === POR_PAGINA);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregandoMais(false);
    }
  }

  useEffect(() => () => clearTimeout(espera.current), []);

  // Alguém postou: a lista não pula sozinha embaixo de quem está lendo; aparece o botão.
  // Em "Todas" qualquer postagem entra; em "Seguindo" a API só devolve quem eu sigo.
  // No "Em alta" uma postagem nova (sem curtidas) não sobe para o topo.
  // As minhas já entram pelo ultimaPostagem.
  useAoVivo((evento, dados) => {
    if (evento !== 'nova_postagem' || filtro === 'alta' || dados.id_usuario === usuario.id_usuario) return;
    // Várias postagens seguidas viram uma busca só
    clearTimeout(espera.current);
    const aba = filtro;
    espera.current = setTimeout(() => {
      api(`/postagens/feed?filtro=${aba}`).then((lista) => setNovo({ filtro: aba, lista })).catch(() => {});
    }, 800);
  });

  const qtdNovas = novo?.filtro === filtro && posts
    ? novo.lista.filter((p) => !posts.some((x) => x.id_postagem === p.id_postagem)).length
    : 0;

  function mostrarNovas() {
    setPosts(novo.lista);
    setTemMais(novo.lista.length === POR_PAGINA);
    setNovo(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const agora = new Date();
  const hora = agora.getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="conteudo feed">
      <div className="coluna-principal">
        <div className="cabecalho-pagina">
          <div><small className="sobretitulo">{agora.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</small><h1>{saudacao}, <em>{usuario.nome.trim().split(/\s+/)[0]}</em></h1><p className="texto-suave">Veja o que a sua comunidade fez hoje e registre a sua ação.</p></div>
          <div className="saldo-movel"><CardSaldo /></div>
          <div className="chips">
            {ABAS.map(([id, nome]) => (
              <button key={id} className="chip" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>{nome}</button>
            ))}
          </div>
        </div>

        <div className="card nova-acao">
          <Avatar nome={usuario.nome} tamanho={44} />
          <button className="falso-campo" onClick={abrirRegistro}>Que ação sustentável você fez hoje?</button>
          <button className="icone-btn" onClick={abrirRegistro} aria-label="Adicionar foto"><Icone nome="camera" tamanho={22} /></button>
          <button className="btn btn-primario" onClick={abrirRegistro}>REGISTRAR</button>
        </div>

        <Link className="desafios-movel" to="/desafios"><Icone nome="award" tamanho={16} /> Ver desafios</Link>
        {usuario.id_patrocinador && <Link className="desafios-movel" to="/patrocinador"><Icone nome="loja" tamanho={16} /> Painel do patrocinador</Link>}
        {qtdNovas > 0 && (
          <button type="button" className="novas-postagens" onClick={mostrarNovas}>
            <Icone nome="seta-cima" tamanho={16} />
            {qtdNovas === 1 ? '1 nova postagem' : `${qtdNovas} novas postagens`}
          </button>
        )}

        {erro && <p className="erro">{erro}</p>}
        {posts === null && !erro && <p className="vazio">Carregando o feed…</p>}
        {posts?.length === 0 && <p className="vazio">{VAZIO[filtro]}</p>}
        {posts?.map((p) => <Postagem key={p.id_postagem} post={p} />)}
        {temMais && posts?.length > 0 && (
          <button type="button" className="btn btn-secundario carregar-mais" onClick={carregarMais} disabled={carregandoMais}>
            {carregandoMais ? 'Carregando…' : 'Carregar mais'}
          </button>
        )}
      </div>

      <aside className="coluna-lateral">
        <CardSaldo />
        <CardImpacto />
        <CardPrimeiroDesafio />
        <CardRanking />
      </aside>
    </div>
  );
}
