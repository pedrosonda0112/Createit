import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import LayoutAuth from '../components/LayoutAuth.jsx';

export default function Login() {
  const { entrar } = useAuth();
  const navegar = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      entrar(await api('/auth/login', { method: 'POST', body: { email, senha } }));
      navegar('/');
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  return (
    <LayoutAuth>
      <form className="auth-form" onSubmit={enviar}>
        <div>
          <h2>Entrar</h2>
          <p className="texto-suave" style={{ marginTop: 8 }}>Registre suas ações, ganhe pontos e troque por benefícios.</p>
        </div>
        <label className="campo">E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" autoComplete="email" required />
        </label>
        <label className="campo">Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
        </label>
        <div className="linha-opcoes">
          <label className="check"><input type="checkbox" defaultChecked />Lembrar de mim</label>
          <a href="#" onClick={(e) => e.preventDefault()} style={{ fontWeight: 700 }}>Esqueci minha senha</a>
        </div>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <button className="btn btn-primario btn-bloco" disabled={enviando}>{enviando ? 'Entrando…' : 'ENTRAR'}</button>
        <div className="divisor">ou</div>
        <Link to="/cadastro" className="btn btn-secundario btn-bloco">Criar conta</Link>
        <p className="rodape">Ao entrar, você concorda com os termos de uso e a política de privacidade (LGPD).</p>
      </form>
    </LayoutAuth>
  );
}
