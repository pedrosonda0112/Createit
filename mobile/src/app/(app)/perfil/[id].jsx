import { useLocalSearchParams } from 'expo-router';
import Perfil from '../../../components/Perfil.jsx';

export default function PerfilDeAlguem() {
  const { id } = useLocalSearchParams();
  return <Perfil id={id} comVoltar />;
}
