import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Shell from './components/Shell.jsx';
import Login from './pages/Login.jsx';
import Cadastro from './pages/Cadastro.jsx';
import Home from './pages/Home.jsx';
import Buscar from './pages/Buscar.jsx';
import Desafios from './pages/Desafios.jsx';
import Recompensas from './pages/Recompensas.jsx';
import Perfil from './pages/Perfil.jsx';
import Comentarios from './pages/Comentarios.jsx';

function Protegida({ children }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return null;
  return usuario ? children : <Navigate to="/login" replace />;
}

function SoDeslogado({ children }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return null;
  return usuario ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<SoDeslogado><Login /></SoDeslogado>} />
      <Route path="/cadastro" element={<SoDeslogado><Cadastro /></SoDeslogado>} />
      <Route element={<Protegida><Shell /></Protegida>}>
        <Route index element={<Home />} />
        <Route path="buscar" element={<Buscar />} />
        <Route path="desafios" element={<Desafios />} />
        <Route path="recompensas" element={<Recompensas />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="perfil/:id" element={<Perfil />} />
        <Route path="postagem/:id" element={<Comentarios />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
