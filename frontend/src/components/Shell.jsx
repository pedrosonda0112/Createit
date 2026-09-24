import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { fmt } from '../util.js';
import Avatar from './Avatar.jsx';
import Icone from './Icone.jsx';
import RegistrarAcao from './RegistrarAcao.jsx';

const itens = [
  { para: '/', nome: 'Feed', icone: 'home', fim: true },
  { para: '/buscar', nome: 'Buscar', icone: 'search' },
  { para: '/desafios', nome: 'Desafios', icone: 'award' },
  { para: '/recompensas', nome: 'Recompensas', icone: 'gift' },
  { para: '/perfil', nome: 'Perfil', icone: 'user' },
];

export default function Shell() {
  const { usuario, sair } = useAuth();
  const navegar = useNavigate();
  const [registrando, setRegistrando] = useState(false);
  const [ultimaPostagem, setUltimaPostagem] = useState(null);
  const [aviso, setAviso] = useState('');
  const [busca, setBusca] = useState('');

  const avisar = useCallback((msg) => setAviso(msg), []);
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  const fecharRegistro = useCallback(() => setRegistrando(false), []);

  function publicada(post) {
    setRegistrando(false);
    setUltimaPostagem(post);
    avisar(`Ação publicada! +${post.pontos_gerados} pts no seu saldo.`);
    navegar('/');
  }

  function buscar(e) {
    e.preventDefault();
    navegar(`/buscar?q=${encodeURIComponent(busca.trim())}`);
  }

  return (
    <>
      <header className="topo">
        <Link to="/" className="marca"><img src="/logo-arvore.png" alt="" /><span>CREATE IT</span></Link>
        <form className="busca-topo" onSubmit={buscar} role="search">
          <Icone nome="search" tamanho={18} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar pessoas, ações ou recompensas" aria-label="Buscar" />
        </form>
        <div className="topo-acoes">
          <span className="saldo-chip"><Icone nome="leaf" tamanho={16} />{fmt(usuario.pontos_ecologicos)} pts</span>
          <button className="icone-btn" aria-label="Notificações"><Icone nome="bell" tamanho={22} /></button>
          <Link to="/perfil" aria-label="Meu perfil"><Avatar nome={usuario.nome} /></Link>
        </div>
      </header>

      <div className="app">
        <nav className="menu" aria-label="Menu principal">
          {itens.map((i) => (
            <NavLink key={i.para} to={i.para} end={i.fim} className={({ isActive }) => (isActive ? 'ativo' : '')}>
              <Icone nome={i.icone} />{i.nome}
            </NavLink>
          ))}
          <button className="btn btn-primario" onClick={() => setRegistrando(true)}><Icone nome="plus" />REGISTRAR AÇÃO</button>
          <button className="menu-item sair" onClick={sair}><Icone nome="logout" />Sair</button>
        </nav>

        <main>
          <Outlet context={{ abrirRegistro: () => setRegistrando(true), ultimaPostagem, avisar }} />
        </main>
      </div>

      <nav className="nav-inferior" aria-label="Menu">
        {itens.slice(0, 2).map((i) => (
          <NavLink key={i.para} to={i.para} end={i.fim} className={({ isActive }) => (isActive ? 'ativo' : '')}><Icone nome={i.icone} tamanho={22} />{i.nome}</NavLink>
        ))}
        <button className="mais" onClick={() => setRegistrando(true)} aria-label="Registrar ação"><Icone nome="plus" tamanho={26} strokeWidth="2.4" /></button>
        {itens.slice(3).map((i) => (
          <NavLink key={i.para} to={i.para} className={({ isActive }) => (isActive ? 'ativo' : '')}><Icone nome={i.icone} tamanho={22} />{i.nome}</NavLink>
        ))}
      </nav>

      {registrando && <RegistrarAcao aoFechar={fecharRegistro} aoPublicar={publicada} />}
      {aviso && <div className="aviso" role="status">{aviso}</div>}
    </>
  );
}
