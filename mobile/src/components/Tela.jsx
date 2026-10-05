// Moldura de todas as telas: área segura, cabeçalho, rolagem e "puxar para atualizar"
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cor } from '../lib/tema.js';
import Icone from './Icone.jsx';
import { Texto } from './ui.jsx';

export function voltar() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

// flutuante: algo que fica por cima da rolagem, logo abaixo do cabeçalho (ex.: "novas postagens")
// rolagemRef: ref do ScrollView, para quem precisar voltar ao topo
export default function Tela({ titulo, comVoltar, direita, aoAtualizar, atualizando = false, rodape, children, rolagem = true, flutuante, rolagemRef }) {
  const cabecalho = (titulo || comVoltar || direita) && (
    <View style={s.cabecalho}>
      {comVoltar && (
        <Pressable onPress={voltar} hitSlop={10} accessibilityLabel="Voltar" style={s.voltar}>
          <Icone nome="voltar" tamanho={22} />
        </Pressable>
      )}
      {titulo ? <Texto titulo estilo={s.titulo} numberOfLines={1}>{titulo}</Texto> : !direita && <View style={{ flex: 1 }} />}
      {direita}
    </View>
  );

  return (
    <SafeAreaView style={s.fundo} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {cabecalho}
        {rolagem ? (<View style={{ flex: 1 }}>
          <ScrollView
            ref={rolagemRef}
            contentContainerStyle={s.conteudo}
            keyboardShouldPersistTaps="handled"
            refreshControl={aoAtualizar ? <RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={cor.gelo} colors={[cor.gelo]} progressBackgroundColor={cor.superficie} /> : undefined}
          >
            {children}
          </ScrollView>
          {flutuante ? <View style={s.flutuante} pointerEvents="box-none">{flutuante}</View> : null}
        </View>) : children}
        {rodape}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: cor.fundo },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  voltar: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  titulo: { flex: 1, fontSize: 26, lineHeight: 32 },
  conteudo: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  flutuante: { position: 'absolute', top: 8, left: 0, right: 0, alignItems: 'center' },
});
