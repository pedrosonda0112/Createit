import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Icone from './Icone.jsx';

const limparUsuario = (v) => v.toLowerCase().replace(/[^a-z0-9._]/g, '');

// Painel admin: editar qualquer conta (dados, pontos, nível e acesso de admin) ou apagá-la
export default function EditarUsuarioAdmin({ alvo, aoFechar, aoSalvar, aoApagar }) {
  const { usuario, atualizar } = useAuth();
  const eu = alvo.id_usuario === usuario.id_usuario;
  const [dados, setDados] = useState({
    nome: alvo.nome, usuario: alvo.usuario, email: alvo.email, cidade: alvo.cidade || '', bio: alvo.bio || '',
    pontos_ecologicos: String(alvo.pontos_ecologicos), nivel: String(alvo.nivel), admin: alvo.admin,
  });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const mudar = (campo) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setDados({ ...dados, [campo]: campo === 'usuario' ? limparUsuario(v) : v });
  };

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
      const u = await api(`/admin/usuarios/${alvo.id_usuario}`, {
        method: 'PUT',
        body: { ...dados, pontos_ecologicos: Number(dados.pontos_ecologicos), nivel: Number(dados.nivel) },
      });
      if (eu) atualizar(u);
      aoSalvar(u);
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  async function apagar() {
    setErro('');
    setEnviando(true);
    try {
      await api(`/admin/usuarios/${alvo.id_usuario}`, { method: 'DELETE' });
      aoApagar(alvo);
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <form className="card modal" onSubmit={salvar} role="dialog" aria-modal="true" aria-labelledby="titulo-admin-usuario">
        <div className="modal-topo">
          <h2 id="titulo-admin-usuario">Editar usuário</h2>
          <button type="button" className="icone-btn" onClick={aoFechar} aria-label="Fechar"><Icone nome="x" /></button>
        </div>

        <label className="campo">
          Nome
          <input value={dados.nome} onChange={mudar('nome')} maxLength={120} required />
        </label>
        <label className="campo">
          Usuário
          <span className="campo-prefixo">@<input value={dados.usuario} onChange={mudar('usuario')} minLength={3} maxLength={40} spellCheck={false} required /></span>
        </label>
        <label className="campo">
          E-mail
          <input type="email" value={dados.email} onChange={mudar('email')} maxLength={160} required />
        </label>
        <label className="campo">
          Cidade
          <input value={dados.cidade} onChange={mudar('cidade')} maxLength={80} />
        </label>
        <label className="campo">
          <span className="linha-entre">Bio<small>{dados.bio.length}/280</small></span>
          <textarea value={dados.bio} onChange={mudar('bio')} maxLength={280} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label className="campo">
            Pontos
            <input type="number" min={0} step={1} value={dados.pontos_ecologicos} onChange={mudar('pontos_ecologicos')} required />
          </label>
          <label className="campo">
            Nível
            <input type="number" min={1} step={1} value={dados.nivel} onChange={mudar('nivel')} required />
          </label>
        </div>
        <label className="admin-checkbox">
          <input type="checkbox" checked={dados.admin} onChange={mudar('admin')} disabled={eu} />
          <span>
            <strong>Administrador</strong>
            <small>{eu ? 'Você não pode tirar o seu próprio acesso.' : 'Pode apagar postagens, comentários e curtidas e editar ou apagar contas.'}</small>
          </span>
        </label>

        {erro && <p className="erro" role="alert">{erro}</p>}
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" className="btn btn-secundario" onClick={aoFechar}>Cancelar</button>
          <button className="btn btn-primario" style={{ flex: 1 }} disabled={enviando}>{enviando ? 'Salvando…' : 'SALVAR'}</button>
        </div>

        {!eu && (
          <div className="admin-perigo">
            {confirmando ? (<>
              <p>
                <strong>Apagar a conta de @{alvo.usuario}?</strong> Postagens, comentários, curtidas, seguidores,
                conquistas e resgates dela também são apagados. Não dá para desfazer.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-secundario btn-pequeno" onClick={() => setConfirmando(false)} autoFocus>Cancelar</button>
                <button type="button" className="btn btn-perigo btn-pequeno" onClick={apagar} disabled={enviando}>
                  {enviando ? 'Apagando…' : 'APAGAR CONTA'}
                </button>
              </div>
            </>) : (
              <button type="button" className="btn btn-secundario btn-pequeno admin-apagar" onClick={() => setConfirmando(true)}>
                <Icone nome="lixeira" tamanho={16} />Apagar conta
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
