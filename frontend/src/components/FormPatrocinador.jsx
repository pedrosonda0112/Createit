import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Icone from './Icone.jsx';

// Formulários (em modal) do painel do patrocinador: desafio e recompensa.
// Com "item" edita; sem "item" cria. aoSalvar recebe o registro que a API devolveu.

const hoje = () => new Date().toLocaleDateString('sv-SE'); // AAAA-MM-DD no fuso do navegador
const somarDias = (dias) => { const d = new Date(); d.setDate(d.getDate() + dias); return d.toLocaleDateString('sv-SE'); };
const soData = (v) => (v ? String(v).slice(0, 10) : '');

function Modal({ titulo, subtitulo, aoFechar, aoEnviar, erro, enviando, rotulo, children }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && aoFechar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [aoFechar]);

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <form className="card modal" onSubmit={aoEnviar} role="dialog" aria-modal="true" aria-labelledby="titulo-form-patrocinador">
        <div className="modal-topo">
          <div><h2 id="titulo-form-patrocinador">{titulo}</h2><p className="texto-suave">{subtitulo}</p></div>
          <button type="button" className="icone-btn" onClick={aoFechar} aria-label="Fechar"><Icone nome="x" /></button>
        </div>
        {children}
        {erro && <p className="erro" role="alert">{erro}</p>}
        <div className="modal-botoes">
          <button type="button" className="btn btn-secundario" onClick={aoFechar}>Cancelar</button>
          <button className="btn btn-primario btn-bloco" disabled={enviando}>{enviando ? 'Salvando…' : rotulo}</button>
        </div>
      </form>
    </div>
  );
}

function useEnvio(caminho, item, aoSalvar) {
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  async function enviar(corpo) {
    setErro('');
    setEnviando(true);
    try {
      const salvo = await api(item ? `${caminho}/${item.id}` : caminho, { method: item ? 'PUT' : 'POST', body: corpo });
      aoSalvar(salvo, !item);
    } catch (e) {
      setErro(e.message);
      setEnviando(false);
    }
  }
  return { erro, enviando, enviar };
}

export function FormDesafio({ desafio, aoFechar, aoSalvar }) {
  const [categorias, setCategorias] = useState([]);
  const [d, setD] = useState({
    titulo: desafio?.titulo || '',
    descricao: desafio?.descricao || '',
    id_categoria: desafio?.id_categoria ? String(desafio.id_categoria) : '',
    meta_acoes: String(desafio?.meta_acoes ?? 5),
    pontos_bonus: String(desafio?.pontos_bonus ?? 100),
    data_inicio: soData(desafio?.data_inicio) || hoje(),
    data_fim: soData(desafio?.data_fim) || somarDias(14),
  });
  const mudar = (campo) => (e) => setD({ ...d, [campo]: e.target.value });
  const { erro, enviando, enviar } = useEnvio('/patrocinador/desafios', desafio && { id: desafio.id_desafio }, aoSalvar);

  useEffect(() => {
    api('/categorias').then((l) => {
      setCategorias(l);
      setD((atual) => (atual.id_categoria ? atual : { ...atual, id_categoria: String(l[0]?.id_categoria || '') }));
    }).catch(() => {});
  }, []);

  return (
    <Modal titulo={desafio ? 'Editar desafio' : 'Novo desafio'} subtitulo="Proponha um hábito e premie quem completar."
      aoFechar={aoFechar} erro={erro} enviando={enviando} rotulo={desafio ? 'SALVAR' : 'PUBLICAR DESAFIO'}
      aoEnviar={(e) => { e.preventDefault(); enviar({ ...d, id_categoria: Number(d.id_categoria), meta_acoes: Number(d.meta_acoes), pontos_bonus: Number(d.pontos_bonus) }); }}>
      <label className="campo">
        Título
        <input value={d.titulo} onChange={mudar('titulo')} minLength={3} maxLength={120} required placeholder="Ex.: Traga seu pote" />
      </label>
      <label className="campo">
        <span className="linha-entre">Descrição<small>{d.descricao.length}/1000</small></span>
        <textarea value={d.descricao} onChange={mudar('descricao')} maxLength={1000}
          placeholder="O que a pessoa precisa fazer para completar o desafio?" />
      </label>
      <label className="campo">
        Categoria das ações
        <select value={d.id_categoria} onChange={mudar('id_categoria')} required>
          {categorias.map((c) => <option key={c.id_categoria} value={c.id_categoria}>{c.nome}</option>)}
        </select>
      </label>
      <div className="campos-dupla">
        <label className="campo">
          Meta (ações)
          <input type="number" min={1} max={100} step={1} value={d.meta_acoes} onChange={mudar('meta_acoes')} required />
        </label>
        <label className="campo">
          Bônus (pontos)
          <input type="number" min={0} max={5000} step={1} value={d.pontos_bonus} onChange={mudar('pontos_bonus')} required />
        </label>
        <label className="campo">
          Começa em
          <input type="date" value={d.data_inicio} onChange={mudar('data_inicio')} required />
        </label>
        <label className="campo">
          Termina em
          <input type="date" value={d.data_fim} min={d.data_inicio} onChange={mudar('data_fim')} required />
        </label>
      </div>
    </Modal>
  );
}

export function FormRecompensa({ recompensa, aoFechar, aoSalvar }) {
  const [r, setR] = useState({
    titulo: recompensa?.titulo || '',
    descricao: recompensa?.descricao || '',
    custo_pontos: String(recompensa?.custo_pontos ?? 500),
    estoque: String(recompensa?.estoque ?? 20),
    validade: soData(recompensa?.validade) || somarDias(60),
  });
  const mudar = (campo) => (e) => setR({ ...r, [campo]: e.target.value });
  const { erro, enviando, enviar } = useEnvio('/patrocinador/recompensas', recompensa && { id: recompensa.id_recompensa }, aoSalvar);

  return (
    <Modal titulo={recompensa ? 'Editar recompensa' : 'Nova recompensa'} subtitulo="O que a comunidade ganha ao trocar pontos com você."
      aoFechar={aoFechar} erro={erro} enviando={enviando} rotulo={recompensa ? 'SALVAR' : 'PUBLICAR RECOMPENSA'}
      aoEnviar={(e) => { e.preventDefault(); enviar({ ...r, custo_pontos: Number(r.custo_pontos), estoque: Number(r.estoque) }); }}>
      <label className="campo">
        Título
        <input value={r.titulo} onChange={mudar('titulo')} minLength={3} maxLength={120} required placeholder="Ex.: 10% de desconto a granel" />
      </label>
      <label className="campo">
        <span className="linha-entre">Descrição<small>{r.descricao.length}/1000</small></span>
        <textarea value={r.descricao} onChange={mudar('descricao')} maxLength={1000}
          placeholder="Regras de uso: onde vale, valor mínimo, horários…" />
      </label>
      <div className="campos-dupla">
        <label className="campo">
          Custo (pontos)
          <input type="number" min={1} max={100000} step={1} value={r.custo_pontos} onChange={mudar('custo_pontos')} required />
        </label>
        <label className="campo">
          Estoque
          <input type="number" min={0} max={100000} step={1} value={r.estoque} onChange={mudar('estoque')} required />
        </label>
        <label className="campo">
          Válida até
          <input type="date" value={r.validade} onChange={mudar('validade')} required />
        </label>
      </div>
    </Modal>
  );
}
