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
import { Avatar, Botao, Card, Chip, Erro, s as ui, Texto, Vazio } from '../../../components/ui.jsx';

const POR_PAGINA = 30;
const ABAS = [['todas', 'Todas'], ['seguindo', 'Seguindo'], ['alta', 'Em alta']];
const VAZIO = {
  todas: 'Ninguém publicou ainda. Registre a primeira ação da comunidade!',
  seguindo: 'Você ainda não segue ninguém. Encontre pessoas na busca ou veja a aba Todas.',
  alta: 'Nenhuma postagem curtida nos últimos 7 dias.',
};

export default function Feed() {
  const { usuario } = useAuth();
  const [filtro, setFiltro] = useState('todas');
  // A API manda 30 por vez: se veio a página cheia, pode haver mais
  const [temMais, setTemMais] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const carregar = useCallback(() => api(`/postagens/feed?filtro=${filtro}`).then((lista) => {
    setTemMais(filtro !== 'alta' && lista.length === POR_PAGINA);
    return lista;
  }), [filtro]);
  const { dados: posts, setDados: setPosts, erro, atualizando, atualizar } = useDados(carregar);
  // Feed novo já buscado, esperando a pessoa tocar em "novas postagens"
  const [novo, setNovo] = useState(null);
  const espera = useRef(null);
  const rolagem = useRef(null);

  useEffect(() => () => clearTimeout(espera.current), []);

  // Alguém postou: a lista não pula sozinha embaixo de quem está lendo; aparece o botão.
  // Em "Todas" qualquer postagem entra; em "Seguindo" a API só devolve quem eu sigo.
  // No "Em alta" uma postagem nova (sem curtidas) não sobe para o topo.
  // As minhas já entram ao voltar da tela de registrar.
  useAoVivo((evento, dados) => {
    if (evento !== 'nova_postagem' || filtro === 'alta' || dados.id_usuario === usuario.id_usuario) return;
    // Várias postagens seguidas viram uma busca só
    clearTimeout(espera.current);
    const aba = filtro;
    espera.current = setTimeout(() => {
      api(`/postagens/feed?filtro=${aba}`).then((lista) => setNovo({ filtro: aba, lista })).catch(() => {});
    }, 800);
  });

  // Conta só as que ainda não estão na tela (puxar para atualizar já zera)
  const qtdNovas = novo?.filtro === filtro && posts
    ? novo.lista.filter((p) => !posts.some((x) => x.id_postagem === p.id_postagem)).length
    : 0;

  async function carregarMais() {
    const ultima = posts[posts.length - 1];
    setCarregandoMais(true);
    try {
      const mais = await api(`/postagens/feed?filtro=${filtro}&antes=${ultima.id_postagem}`);
      setPosts((l) => [...l, ...mais.filter((p) => !l.some((x) => x.id_postagem === p.id_postagem))]);
      setTemMais(mais.length === POR_PAGINA);
    } catch {
      setTemMais(false);
    } finally {
      setCarregandoMais(false);
    }
  }

  function mostrarNovas() {
    setPosts(novo.lista);
    setTemMais(novo.lista.length === POR_PAGINA);
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
          {ABAS.map(([id, nome]) => (
            <Chip key={id} ativo={filtro === id} onPress={() => trocarFiltro(id)}>{nome}</Chip>
          ))}
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
      {posts?.length === 0 && <Vazio>{VAZIO[filtro]}</Vazio>}
      {posts?.map((p) => (
        <Postagem key={p.id_postagem} post={p} aoApagar={(id) => setPosts((l) => l.filter((x) => x.id_postagem !== id))} />
      ))}
      {temMais && posts?.length > 0 && (
        <Botao tipo="secundario" pequeno carregando={carregandoMais} onPress={carregarMais} estilo={{ alignSelf: 'center' }}>Carregar mais</Botao>
      )}
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
