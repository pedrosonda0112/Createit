import { View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../lib/auth.jsx';
import { cor } from '../../lib/tema.js';

// Tudo aqui exige login. As abas ficam em (tabs); as outras telas abrem por cima delas.
export default function AppLayout() {
  const { usuario, carregando } = useAuth();
  if (carregando) return <View style={{ flex: 1, backgroundColor: cor.fundo }} />;
  if (!usuario) return <Redirect href="/login" />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cor.fundo } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="registrar" options={{ presentation: 'modal' }} />
      <Stack.Screen name="editar-perfil" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
