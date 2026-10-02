import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
// Importa peso por peso para não embutir no app as 36 variações de cada fonte
import { Montserrat_800ExtraBold } from '@expo-google-fonts/montserrat/800ExtraBold';
import { Montserrat_900Black } from '@expo-google-fonts/montserrat/900Black';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { AuthProvider } from '../lib/auth.jsx';
import { AvisoProvider } from '../components/Aviso.jsx';
import { cor } from '../lib/tema.js';

export default function RootLayout() {
  const [fontesProntas, erroFontes] = useFonts({
    Montserrat_800ExtraBold, Montserrat_900Black, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold,
  });
  // Sem as fontes o app ainda funciona (cai na fonte do sistema), então só espera se não deu erro
  if (!fontesProntas && !erroFontes) return <View style={{ flex: 1, backgroundColor: cor.fundo }} />;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AvisoProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cor.fundo } }} />
        </AvisoProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
