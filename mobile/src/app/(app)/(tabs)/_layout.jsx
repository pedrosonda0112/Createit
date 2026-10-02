import { View } from 'react-native';
import { router } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import Icone from '../../../components/Icone.jsx';
import { cor, fonte } from '../../../lib/tema.js';

// Mesma barra inferior do web no celular, com o botão de registrar ação no meio
const icone = (nome) => ({ color }) => <Icone nome={nome} tamanho={22} cor={color} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cor.gelo,
        tabBarInactiveTintColor: cor.textoSuave,
        tabBarStyle: { backgroundColor: cor.superficie, borderTopColor: cor.borda },
        tabBarLabelStyle: { fontFamily: fonte.textoMedio, fontSize: 11 },
        sceneStyle: { backgroundColor: cor.fundo },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Feed', tabBarIcon: icone('home') }} />
      <Tabs.Screen name="desafios" options={{ title: 'Desafios', tabBarIcon: icone('award') }} />
      <Tabs.Screen
        name="acao"
        options={{
          title: '',
          tabBarAccessibilityLabel: 'Registrar ação',
          tabBarIcon: () => (
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: cor.gelo, alignItems: 'center', justifyContent: 'center', marginTop: 14 }}>
              <Icone nome="plus" tamanho={26} cor={cor.fundo} espessura={2.4} />
            </View>
          ),
        }}
        listeners={{
          // Não é uma aba de verdade: abre o formulário por cima da tela atual
          tabPress: (e) => {
            e.preventDefault();
            router.push('/registrar');
          },
        }}
      />
      <Tabs.Screen name="recompensas" options={{ title: 'Recompensas', tabBarIcon: icone('gift') }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icone('user') }} />
    </Tabs>
  );
}
