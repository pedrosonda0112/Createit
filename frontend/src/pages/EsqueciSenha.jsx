import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import LayoutAuth from '../components/LayoutAuth.jsx';
import { mascaraCpf } from '../util.js';

export default function EsqueciSenha() {
  const [dados, setDados] = useState({ email: '', cpf: '', senha: '', confirmar: '' });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);
  const mudar = (campo) => (e) => setDados({ ...dados, [campo]: campo === 'cpf' ? mascaraCpf(e.target.value) : e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    if (dados.senha !== dados.confirmar) return setErro('As duas senhas não são iguais.');
    setEnviando(true);
    try {
      await api('/auth/redefinir-senha', { method: 'POST', body: { email: dados.email, cpf: dados.cpf, senha: dados.senha } });
      setPronto(true);
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  if (pronto) {
    return (
      <LayoutAuth>
        <div className="auth-form">
          <div>
            <h2>Senha alterada</h2>
            <p className="texto-suave" style={{ marginTop: 8 }}>Pronto! Agora é só entrar com a nova senha.</p>
          </div>
          <Link to="/login" className="btn btn-primario btn-bloco">IR PARA O LOGIN</Link>
        </div>
      </LayoutAuth>
    );
  }

  return (
    <LayoutAuth>
      <form className="auth-form" onSubmit={enviar}>
        <div>
          <h2>Esqueci minha senha</h2>
          <p className="texto-suave" style={{ marginTop: 8 }}>Confirme o e-mail e o CPF da sua conta e escolha uma senha nova.</p>
        </div>
        <label className="campo">E-mail<input type="email" value={dados.email} onChange={mudar('email')} placeholder="voce@email.com" autoComplete="email" required /></label>
        <label className="campo">CPF<input value={dados.cpf} onChange={mudar('cpf')} placeholder="000.000.000-00" inputMode="numeric" required /></label>
        <label className="campo">Nova senha<input type="password" value={dados.senha} onChange={mudar('senha')} placeholder="Mínimo 8 caracteres" minLength={8} autoComplete="new-password" required /></label>
        <label className="campo">Confirmar nova senha<input type="password" value={dados.confirmar} onChange={mudar('confirmar')} placeholder="Repita a senha" minLength={8} autoComplete="new-password" required /></label>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <button className="btn btn-primario btn-bloco" disabled={enviando}>{enviando ? 'Salvando…' : 'REDEFINIR SENHA'}</button>
        <p className="rodape" style={{ fontSize: 14 }}>Lembrou a senha? <Link to="/login" style={{ fontWeight: 700 }}>Entrar</Link></p>
      </form>
    </LayoutAuth>
  );
}
