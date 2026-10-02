import { View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../lib/auth.jsx';
import { cor } from '../../lib/tema.js';

// Telas só para quem não está logado
export default function AuthLayout() {
  const { usuario, carregando } = useAuth();
  if (carregando) return <View style={{ flex: 1, backgroundColor: cor.fundo }} />;
  if (usuario) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cor.fundo } }} />;
}
