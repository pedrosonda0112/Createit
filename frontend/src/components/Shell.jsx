import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

import Avatar from './Avatar.jsx';
import Icone from './Icone.jsx';
import RegistrarAcao from './RegistrarAcao.jsx';

const itens = [
  { para: '/', nome: 'Início', icone: 'home', fim: true },
  { para: '/buscar', nome: 'Explorar', icone: 'search' },
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
        <Link to="/" aria-label="Create It — início" className="marca"><img src="/marca-arvore-verde.png" alt="" /><span>CREATE IT</span></Link>
        <form className="busca-topo" onSubmit={buscar} role="search">
          <Icone nome="search" tamanho={18} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar pessoas, ações ou recompensas" aria-label="Buscar" />
        </form>
        <div className="topo-acoes">
          
          <button className="icone-btn" aria-label="Notificações"><Icone nome="bell" tamanho={22} /></button>
          <Link to="/perfil" aria-label="Meu perfil"><Avatar nome={usuario.nome} /></Link>
        </div>
      </header>

      <div className="app">
        <nav className="menu" aria-label="Menu principal">
          <Link to="/" className="marca marca-menu"><img src="/marca-arvore-verde.png" alt="" /><span>CREATE IT</span></Link>
          {itens.map((i) => (
            <NavLink key={i.para} to={i.para} end={i.fim} className={({ isActive }) => (isActive ? 'ativo' : '')}>
              <Icone nome={i.icone} />{i.nome}
            </NavLink>
          ))}
          {usuario.admin && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? 'ativo' : '')}><Icone nome="escudo" />Admin</NavLink>
          )}
          <button className="btn btn-primario" onClick={() => setRegistrando(true)}><Icone nome="plus" />REGISTRAR AÇÃO</button>
          <div className="usuario-menu"><Avatar nome={usuario.nome} /><Link to="/perfil"><strong>{usuario.nome}</strong><small>@{usuario.usuario}{usuario.cidade && ` · ${usuario.cidade}`}</small></Link><button className="icone-btn" onClick={sair} aria-label="Sair"><Icone nome="logout" /></button></div>
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
