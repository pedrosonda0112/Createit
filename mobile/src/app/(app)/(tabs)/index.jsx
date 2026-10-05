import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../../lib/api.js';
import { useAuth } from '../../../lib/auth.jsx';
import { useAoVivo } from '../../../lib/aoVivo.js';
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
  // Feed novo já buscado, esperando a pessoa tocar em "novas postagens"
  const [novo, setNovo] = useState(null);
  const espera = useRef(null);
  const rolagem = useRef(null);

  useEffect(() => () => clearTimeout(espera.current), []);

  // Alguém postou: a API diz se entra no meu feed (sigo a pessoa?). A lista não pula
  // sozinha embaixo de quem está lendo; aparece o botão. Só no "Seguindo": no
  // "Em alta" uma postagem nova (sem curtidas) não sobe para o topo.
  // As minhas já entram ao voltar da tela de registrar.
  useAoVivo((evento, dados) => {
    if (evento !== 'nova_postagem' || filtro !== 'seguindo' || dados.id_usuario === usuario.id_usuario) return;
    // Várias postagens seguidas viram uma busca só
    clearTimeout(espera.current);
    espera.current = setTimeout(() => {
      api('/postagens/feed?filtro=seguindo').then((lista) => setNovo({ filtro: 'seguindo', lista })).catch(() => {});
    }, 800);
  });

  // Conta só as que ainda não estão na tela (puxar para atualizar já zera)
  const qtdNovas = novo?.filtro === filtro && posts
    ? novo.lista.filter((p) => !posts.some((x) => x.id_postagem === p.id_postagem)).length
    : 0;

  function mostrarNovas() {
    setPosts(novo.lista);
    setNovo(null);
    rolagem.current?.scrollTo({ y: 0, animated: true });
  }

  function trocarFiltro(f) {
    if (f === filtro) return;
    setPosts(null);
    setNovo(null);
    setFiltro(f);
  }

  const abrirRegistro = () => router.push('/registrar');

  return (
    <Tela
      aoAtualizar={atualizar}
      atualizando={atualizando}
      rolagemRef={rolagem}
      flutuante={qtdNovas > 0 && (
        <Pressable onPress={mostrarNovas} style={s.novas} accessibilityRole="button">
          <Icone nome="seta-cima" tamanho={16} cor={cor.fundo} />
          <Texto estilo={s.novasTexto}>{qtdNovas === 1 ? '1 nova postagem' : `${qtdNovas} novas postagens`}</Texto>
        </Pressable>
      )}
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
  novas: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 16, borderRadius: 999,
    backgroundColor: cor.gelo, elevation: 6, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  novasTexto: { fontFamily: fonte.textoForte, fontSize: 13, color: cor.fundo },
  novaAcao: { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  falsoCampo: {
    flex: 1, height: 44, justifyContent: 'center', paddingHorizontal: 14,
    borderRadius: raio.campo, borderWidth: 1, borderColor: cor.borda, backgroundColor: cor.fundo,
  },
});
