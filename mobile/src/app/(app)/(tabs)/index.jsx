import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../../lib/api.js';
import { useAuth } from '../../../lib/auth.jsx';
import { useDados } from '../../../lib/useDados.js';
import { fmt } from '../../../lib/util.js';
import { cor, fonte, raio } from '../../../lib/tema.js';
import Icone from '../../../components/Icone.jsx';
import Postagem from '../../../components/Postagem.jsx';
import Tela from '../../../components/Tela.jsx';
import { Avatar, Card, Chip, Erro, s as ui, Texto, Vazio } from '../../../components/ui.jsx';

export default function Feed() {
  const { usuario } = useAuth();
  const [filtro, setFiltro] = useState('seguindo');
  const carregar = useCallback(() => api(`/postagens/feed?filtro=${filtro}`), [filtro]);
  const { dados: posts, setDados: setPosts, erro, atualizando, atualizar } = useDados(carregar);

  function trocarFiltro(f) {
    if (f === filtro) return;
    setPosts(null);
    setFiltro(f);
  }

  const abrirRegistro = () => router.push('/registrar');

  return (
    <Tela
      aoAtualizar={atualizar}
      atualizando={atualizando}
      direita={(<>
        <View style={s.marca}>
          <Image source={require('../../../../assets/logo-arvore.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
          <Texto titulo estilo={{ fontSize: 18 }}>CREATE IT</Texto>
        </View>
        <Pressable onPress={() => router.push('/recompensas')} style={s.saldoChip} accessibilityLabel="Seu saldo">
          <Icone nome="leaf" tamanho={16} cor={cor.gelo} />
          <Texto estilo={s.saldoTexto}>{fmt(usuario.pontos_ecologicos)} pts</Texto>
        </Pressable>
        <Pressable onPress={() => router.push('/buscar')} hitSlop={8} accessibilityLabel="Buscar" style={{ padding: 4 }}>
          <Icone nome="search" tamanho={22} />
        </Pressable>
      </>)}
    >
      <View style={ui.linhaEntre}>
        <Texto titulo estilo={{ fontSize: 26 }}>Feed</Texto>
        <View style={ui.chips}>
          <Chip ativo={filtro === 'seguindo'} onPress={() => trocarFiltro('seguindo')}>Seguindo</Chip>
          <Chip ativo={filtro === 'alta'} onPress={() => trocarFiltro('alta')}>Em alta</Chip>
        </View>
      </View>

      <Card estilo={s.novaAcao}>
        <Avatar nome={usuario.nome} tamanho={40} />
        <Pressable onPress={abrirRegistro} style={s.falsoCampo}>
          <Texto suave numberOfLines={1} estilo={{ fontSize: 14 }}>Que ação sustentável você fez hoje?</Texto>
        </Pressable>
        <Pressable onPress={abrirRegistro} hitSlop={6} accessibilityLabel="Adicionar foto">
          <Icone nome="camera" tamanho={22} cor={cor.textoSuave} />
        </Pressable>
      </Card>

      <Erro>{erro}</Erro>
      {posts === null && !erro && <Vazio>Carregando o feed…</Vazio>}
      {posts?.length === 0 && <Vazio>Nada por aqui ainda. Siga outras pessoas pela busca ou registre sua primeira ação.</Vazio>}
      {posts?.map((p) => (
        <Postagem key={p.id_postagem} post={p} aoApagar={(id) => setPosts((l) => l.filter((x) => x.id_postagem !== id))} />
      ))}
    </Tela>
  );
}

const s = StyleSheet.create({
  marca: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  saldoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12,
    borderRadius: 999, borderWidth: 1, borderColor: cor.borda, backgroundColor: cor.superficie,
  },
  saldoTexto: { fontFamily: fonte.tituloForte, fontSize: 13, color: cor.gelo },
  novaAcao: { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  falsoCampo: {
    flex: 1, height: 44, justifyContent: 'center', paddingHorizontal: 14,
    borderRadius: raio.campo, borderWidth: 1, borderColor: cor.borda, backgroundColor: cor.fundo,
  },
});
