import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('createit_token')) { setCarregando(false); return; }
    api('/auth/eu')
      .then(setUsuario)
      .catch(() => localStorage.removeItem('createit_token'))
      .finally(() => setCarregando(false));
  }, []);

  const entrar = ({ token, usuario }) => {
    localStorage.setItem('createit_token', token);
    setUsuario(usuario);
  };
  const sair = () => {
    localStorage.removeItem('createit_token');
    setUsuario(null);
  };
  // Atualiza só alguns campos (ex.: saldo depois de registrar ação ou resgatar)
  const atualizar = (campos) => setUsuario((u) => ({ ...u, ...campos }));

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, sair, atualizar }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
