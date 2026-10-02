import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';
import { apagarToken, lerToken, salvarToken } from './sessao.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    lerToken()
      .then((token) => token && api('/auth/eu').then(setUsuario))
      .catch((e) => { if (e.status === 401 || e.status === 404) apagarToken(); })
      .finally(() => setCarregando(false));
  }, []);

  const entrar = async ({ token, usuario }) => {
    await salvarToken(token);
    setUsuario(usuario);
  };
  const sair = async () => {
    await apagarToken();
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
