// Moldura do login/cadastro: marca, carpas e slogan no topo, formulário embaixo
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cor } from '../lib/tema.js';
import { Texto } from './ui.jsx';

export default function LayoutAuth({ children }) {
  return (
    <SafeAreaView style={s.fundo}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.rolagem} keyboardShouldPersistTaps="handled">
          <View style={s.marca}>
            <Image source={require('../../assets/logo-arvore.png')} style={s.logo} resizeMode="contain" />
            <Texto titulo estilo={s.nome}>CREATE IT</Texto>
            <Image source={require('../../assets/carpas.png')} style={s.carpas} resizeMode="contain" />
            <Texto titulo estilo={s.slogan}>SEJA O PRIMEIRO A QUEBRAR O CICLO</Texto>
          </View>
          <View style={s.painel}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: cor.fundo },
  rolagem: { flexGrow: 1, padding: 16, gap: 24 },
  marca: { backgroundColor: cor.gelo, borderRadius: 24, alignItems: 'center', paddingVertical: 24, gap: 8 },
  logo: { width: 48, height: 48 },
  nome: { color: cor.fundo, fontSize: 28 },
  carpas: { width: 120, height: 80 },
  slogan: { color: cor.fundo, fontSize: 12, letterSpacing: 1 },
  painel: { gap: 16 },
});
