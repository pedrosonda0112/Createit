import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Icone from './Icone.jsx';

// O @ só aceita o que o back-end aceita: minúsculas, números, ponto e _
const limparUsuario = (v) => v.toLowerCase().replace(/[^a-z0-9._]/g, '');

export default function EditarPerfil({ perfil, aoFechar, aoSalvar }) {
  const { atualizar } = useAuth();
  const [dados, setDados] = useState({ nome: perfil.nome, usuario: perfil.usuario, cidade: perfil.cidade || '', bio: perfil.bio || '' });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const mudar = (campo) => (e) => setDados({ ...dados, [campo]: campo === 'usuario' ? limparUsuario(e.target.value) : e.target.value });

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
      const u = await api('/auth/eu', { method: 'PUT', body: dados });
      atualizar(u);
      aoSalvar(u);
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <form className="card modal" onSubmit={salvar} role="dialog" aria-modal="true" aria-labelledby="titulo-editar">
        <div className="modal-topo">
          <h2 id="titulo-editar">Editar perfil</h2>
          <button type="button" className="icone-btn" onClick={aoFechar} aria-label="Fechar"><Icone nome="x" /></button>
        </div>

        <label className="campo">
          Nome
          <input value={dados.nome} onChange={mudar('nome')} maxLength={120} autoComplete="name" required />
        </label>
        <label className="campo">
          Usuário
          <span className="campo-prefixo">@<input value={dados.usuario} onChange={mudar('usuario')} minLength={3} maxLength={40} autoComplete="username" spellCheck={false} required /></span>
          <small>Letras minúsculas, números, ponto e _.</small>
        </label>
        <label className="campo">
          Cidade
          <input value={dados.cidade} onChange={mudar('cidade')} maxLength={80} placeholder="Onde você mora" autoComplete="address-level2" />
        </label>
        <label className="campo">
          <span className="linha-entre">Bio<small>{dados.bio.length}/280</small></span>
          <textarea value={dados.bio} onChange={mudar('bio')} maxLength={280} placeholder="Conte um pouco sobre você" />
        </label>

        {erro && <p className="erro" role="alert">{erro}</p>}
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" className="btn btn-secundario" onClick={aoFechar}>Cancelar</button>
          <button className="btn btn-primario" style={{ flex: 1 }} disabled={enviando}>{enviando ? 'Salvando…' : 'SALVAR'}</button>
        </div>
      </form>
    </div>
  );
}
