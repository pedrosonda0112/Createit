import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Icone from './Icone.jsx';

// 00.000.000/0000-00 enquanto digita
const mascaraCnpj = (v) => v.replace(/\D/g, '').slice(0, 14)
  .replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
  .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');

// Painel admin: cadastrar uma empresa parceira nova
export default function NovoPatrocinador({ aoFechar, aoSalvar }) {
  const [d, setD] = useState({ razao_social: '', cnpj: '', porte: 'micro', localizacao: '' });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const mudar = (campo) => (e) => setD({ ...d, [campo]: campo === 'cnpj' ? mascaraCnpj(e.target.value) : e.target.value });

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && aoFechar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [aoFechar]);

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      aoSalvar(await api('/admin/patrocinadores', { method: 'POST', body: d }));
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <form className="card modal" onSubmit={salvar} role="dialog" aria-modal="true" aria-labelledby="titulo-novo-patrocinador">
        <div className="modal-topo">
          <h2 id="titulo-novo-patrocinador">Nova empresa parceira</h2>
          <button type="button" className="icone-btn" onClick={aoFechar} aria-label="Fechar"><Icone nome="x" /></button>
        </div>
        <label className="campo">
          Razão social
          <input value={d.razao_social} onChange={mudar('razao_social')} minLength={2} maxLength={120} required />
        </label>
        <label className="campo">
          CNPJ
          <input value={d.cnpj} onChange={mudar('cnpj')} inputMode="numeric" placeholder="00.000.000/0000-00" required />
        </label>
        <div className="campos-dupla">
          <label className="campo">
            Porte
            <select value={d.porte} onChange={mudar('porte')}>
              <option value="micro">Micro</option>
              <option value="pequeno">Pequeno</option>
              <option value="medio">Médio</option>
              <option value="grande">Grande</option>
            </select>
          </label>
          <label className="campo">
            Localização
            <input value={d.localizacao} onChange={mudar('localizacao')} maxLength={120} placeholder="Bairro ou cidade" />
          </label>
        </div>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <div className="modal-botoes">
          <button type="button" className="btn btn-secundario" onClick={aoFechar}>Cancelar</button>
          <button className="btn btn-primario btn-bloco" disabled={enviando}>{enviando ? 'Salvando…' : 'CADASTRAR'}</button>
        </div>
      </form>
    </div>
  );
}
