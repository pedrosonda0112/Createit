import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import LayoutAuth from '../components/LayoutAuth.jsx';

// Formata o CPF enquanto a pessoa digita: 000.000.000-00
const mascaraCpf = (v) => v.replace(/\D/g, '').slice(0, 11)
  .replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');

export default function Cadastro() {
  const { entrar } = useAuth();
  const navegar = useNavigate();
  const [dados, setDados] = useState({ nome: '', cpf: '', email: '', senha: '' });
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const mudar = (campo) => (e) => setDados({ ...dados, [campo]: campo === 'cpf' ? mascaraCpf(e.target.value) : e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      entrar(await api('/auth/cadastro', { method: 'POST', body: dados }));
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
          <h2>Criar conta</h2>
          <p className="texto-suave" style={{ marginTop: 8 }}>Cada ação sustentável que você registrar vira ponto. Os pontos viram benefício com os parceiros.</p>
        </div>
        <label className="campo">Nome completo<input value={dados.nome} onChange={mudar('nome')} placeholder="Seu nome" autoComplete="name" required /></label>
        <label className="campo">CPF<input value={dados.cpf} onChange={mudar('cpf')} placeholder="000.000.000-00" inputMode="numeric" required /></label>
        <label className="campo">E-mail<input type="email" value={dados.email} onChange={mudar('email')} placeholder="voce@email.com" autoComplete="email" required /></label>
        <label className="campo">Senha<input type="password" value={dados.senha} onChange={mudar('senha')} placeholder="Mínimo 8 caracteres" minLength={8} autoComplete="new-password" required /></label>
        <label className="check" style={{ fontSize: 13, alignItems: 'flex-start' }}>
          <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
          Li e aceito os termos de uso e a política de privacidade (LGPD).
        </label>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <button className="btn btn-primario btn-bloco" disabled={enviando || !aceite}>{enviando ? 'Criando…' : 'CRIAR CONTA'}</button>
        <p className="rodape" style={{ fontSize: 14 }}>Já tem conta? <Link to="/login" style={{ fontWeight: 700 }}>Entrar</Link></p>
      </form>
    </LayoutAuth>
  );
}
