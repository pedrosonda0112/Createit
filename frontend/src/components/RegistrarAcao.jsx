import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { iconeCategoria } from '../util.js';
import Icone from './Icone.jsx';

export default function RegistrarAcao({ aoFechar, aoPublicar }) {
  const { atualizar } = useAuth();
  const [categorias, setCategorias] = useState([]);
  const [desafios, setDesafios] = useState([]);
  const [categoria, setCategoria] = useState(null);
  const [conteudo, setConteudo] = useState('');
  const [desafio, setDesafio] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api('/categorias').then((c) => { setCategorias(c); setCategoria(c[0]?.id_categoria); });
    api('/desafios').then(setDesafios).catch(() => {});
    const esc = (e) => e.key === 'Escape' && aoFechar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [aoFechar]);

  const selecionada = categorias.find((c) => c.id_categoria === categoria);
  const desafiosDaCategoria = desafios.filter((d) => d.id_categoria === categoria);

  async function publicar(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const r = await api('/postagens', { method: 'POST', body: { id_categoria: categoria, conteudo, id_desafio: desafio || null } });
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
        <button className="btn btn-primario btn-bloco" disabled={enviando || !conteudo.trim()}>
          {enviando ? 'Publicando…' : 'PUBLICAR AÇÃO'}
        </button>
      </form>
    </div>
  );
}
