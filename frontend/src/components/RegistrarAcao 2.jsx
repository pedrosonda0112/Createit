import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { iconeCategoria, LIMITE_FOTO, reduzirFoto } from '../util.js';
import Icone from './Icone.jsx';

export default function RegistrarAcao({ aoFechar, aoPublicar }) {
  const { atualizar } = useAuth();
  const [categorias, setCategorias] = useState([]);
  const [desafios, setDesafios] = useState([]);
  const [categoria, setCategoria] = useState(null);
  const [conteudo, setConteudo] = useState('');
  const [desafio, setDesafio] = useState('');
  const [foto, setFoto] = useState(null);
  const [previa, setPrevia] = useState('');
  const [preparandoFoto, setPreparandoFoto] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const campoFoto = useRef(null);

  useEffect(() => {
    api('/categorias').then((c) => { setCategorias(c); setCategoria(c[0]?.id_categoria); });
    api('/desafios').then(setDesafios).catch(() => {});
    const esc = (e) => e.key === 'Escape' && aoFechar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [aoFechar]);

  // Prévia da foto escolhida (a URL temporária é liberada quando a foto muda)
  useEffect(() => {
    if (!foto) { setPrevia(''); return; }
    const url = URL.createObjectURL(foto);
    setPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  const selecionada = categorias.find((c) => c.id_categoria === categoria);
  const desafiosDaCategoria = desafios.filter((d) => d.id_categoria === categoria);

  async function escolherFoto(e) {
    const arquivo = e.target.files[0];
    e.target.value = ''; // deixa escolher o mesmo arquivo de novo depois de remover
    if (!arquivo) return;
    setErro('');
    if (!arquivo.type.startsWith('image/')) { setErro('Escolha um arquivo de imagem.'); return; }
    setPreparandoFoto(true);
    const reduzida = await reduzirFoto(arquivo);
    setPreparandoFoto(false);
    if (reduzida.size > LIMITE_FOTO) { setErro('A foto pode ter no máximo 5 MB.'); return; }
    setFoto(reduzida);
  }

  async function publicar(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    const dados = new FormData();
    dados.append('id_categoria', categoria);
    dados.append('conteudo', conteudo);
    if (desafio) dados.append('id_desafio', desafio);
    if (foto) dados.append('foto', foto);
    try {
      const r = await api('/postagens', { method: 'POST', body: dados });
      atualizar({ pontos_ecologicos: r.pontos_ecologicos, nivel: r.nivel });
      aoPublicar(r.postagem);
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <form className="card modal" onSubmit={publicar} role="dialog" aria-modal="true" aria-labelledby="titulo-registrar">
        <div className="modal-topo">
          <h2 id="titulo-registrar">Registrar ação</h2>
          <button type="button" className="icone-btn" onClick={aoFechar} aria-label="Fechar"><Icone nome="x" /></button>
        </div>

        <div className="campo">
          Categoria
          <div className="categorias-opcoes">
            {categorias.map((c) => (
              <button type="button" key={c.id_categoria} aria-pressed={c.id_categoria === categoria}
                onClick={() => { setCategoria(c.id_categoria); setDesafio(''); }}>
                <Icone nome={iconeCategoria[c.nome] || 'leaf'} />{c.nome}
              </button>
            ))}
          </div>
        </div>

        <label className="campo">
          O que você fez?
          <textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} required maxLength={500}
            placeholder="Ex.: levei 3 kg de recicláveis ao ponto de coleta" />
        </label>

        <div className="campo">
          Foto (opcional)
          {previa ? (
            <div className="foto-previa">
              <img src={previa} alt="Prévia da foto escolhida" />
              <button type="button" className="icone-btn" onClick={() => setFoto(null)} aria-label="Remover foto"><Icone nome="x" tamanho={18} /></button>
            </div>
          ) : (
            <button type="button" className="foto-escolher" onClick={() => campoFoto.current.click()} disabled={preparandoFoto}>
              <Icone nome="camera" tamanho={22} />{preparandoFoto ? 'Preparando foto…' : 'Adicionar foto'}
            </button>
          )}
          <input ref={campoFoto} type="file" accept="image/*" hidden onChange={escolherFoto} />
        </div>

        {desafiosDaCategoria.length > 0 && (
          <label className="campo">
            Vincular a um desafio (opcional)
            <select value={desafio} onChange={(e) => setDesafio(e.target.value)}>
              <option value="">Nenhum</option>
              {desafiosDaCategoria.map((d) => <option key={d.id_desafio} value={d.id_desafio}>{d.titulo}</option>)}
            </select>
          </label>
        )}

        <div className="previa-pontos">
          <div><small className="texto-suave">Você vai ganhar</small><br /><strong>+{selecionada?.pontos_base ?? 0} pts</strong></div>
          <small className="texto-suave" style={{ textAlign: 'right', maxWidth: 170 }}>Creditados assim que a ação for validada</small>
        </div>

        {erro && <p className="erro" role="alert">{erro}</p>}
        <button className="btn btn-primario btn-bloco" disabled={enviando || preparandoFoto || !conteudo.trim()}>
          {enviando ? (foto ? 'Enviando foto…' : 'Publicando…') : 'PUBLICAR AÇÃO'}
        </button>
      </form>
    </div>
  );
}
