import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, Share, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useAoVivo } from '../lib/aoVivo.js';
import { iconeCategoria, tempo } from '../lib/util.js';
import { cor, fonte } from '../lib/tema.js';
import { useAviso } from './Aviso.jsx';
import Icone from './Icone.jsx';
import { Avatar, Card, Texto } from './ui.jsx';

export default function Postagem({ post, aoComentar, aoApagar }) {
  const { usuario, atualizar } = useAuth();
  const avisar = useAviso();
  const [curtiu, setCurtiu] = useState(post.curtiu);
  const [curtidas, setCurtidas] = useState(post.curtidas);
  const [comentarios, setComentarios] = useState(post.comentarios);
  const [apagada, setApagada] = useState(false);
  // A lista recarrega ao voltar para a tela: acompanha os números novos do servidor
  useEffect(() => { setCurtiu(post.curtiu); setCurtidas(post.curtidas); }, [post.curtiu, post.curtidas]);
  useEffect(() => { setComentarios(post.comentarios); }, [post.comentarios]);

  // Totais ao vivo; se outra pessoa (ou outro aparelho) apagou, o card some
  useAoVivo((evento, dados) => {
    if (dados.id_postagem !== post.id_postagem) return;
    if (evento === 'contadores') {
      setCurtidas(dados.curtidas);
      setComentarios(dados.comentarios);
    } else if (evento === 'postagem_apagada') {
      setApagada(true);
    }
  });
  const minha = post.id_usuario === usuario.id_usuario;
  const pontos = post.status_validacao === 'validada' ? post.pontos_gerados : 0;
  const abrirPerfil = () => router.push(`/perfil/${post.id_usuario}`);

  async function curtir() {
    // Atualiza na tela na hora e confirma com o servidor
    setCurtiu(!curtiu);
    setCurtidas((n) => n + (curtiu ? -1 : 1));
    try {
      const r = await api(`/postagens/${post.id_postagem}/curtir`, { method: 'POST' });
      setCurtiu(r.curtiu);
      setCurtidas(r.curtidas);
    } catch {
      setCurtiu(curtiu);
      setCurtidas(post.curtidas);
    }
  }

  async function apagar() {
    try {
      const saldo = await api(`/postagens/${post.id_postagem}`, { method: 'DELETE' });
      atualizar(saldo);
      avisar(pontos > 0 ? `Ação apagada. −${pontos} pts no seu saldo.` : 'Ação apagada.');
      // Quem mostra a lista pode tirar a postagem dela; senão, o card só some
      if (aoApagar) aoApagar(post.id_postagem);
      else setApagada(true);
    } catch (err) {
      avisar(err.message);
    }
  }

  function confirmarApagar() {
    Alert.alert(
      'Apagar esta ação?',
      `${pontos > 0 ? `Os ${pontos} pts que ela deu saem do seu saldo. ` : ''}Curtidas e comentários também são apagados.`,
      [{ text: 'Cancelar', style: 'cancel' }, { text: 'Apagar', style: 'destructive', onPress: apagar }],
    );
  }

  function compartilhar() {
    Share.share({ message: `${post.nome} no Create It: ${post.conteudo}` }).catch(() => {});
  }

  if (apagada) return null;

  return (
    <Card estilo={s.post}>
      <View style={s.topo}>
        <Pressable onPress={abrirPerfil}><Avatar nome={post.nome} /></Pressable>
        <Pressable onPress={abrirPerfil} style={{ flex: 1 }}>
          <Texto forte estilo={{ fontSize: 14, lineHeight: 18 }}>{post.nome}</Texto>
          <Texto suave estilo={{ fontSize: 12, lineHeight: 16 }}>@{post.usuario} · {tempo(post.data_postagem)}</Texto>
        </Pressable>
        {post.pontos_gerados > 0 && <Texto estilo={s.ptsChip}>+{post.pontos_gerados}</Texto>}
        {minha && (
          <Pressable onPress={confirmarApagar} hitSlop={8} accessibilityLabel="Apagar ação" style={s.iconeBtn}>
            <Icone nome="lixeira" tamanho={18} cor={cor.textoSuave} />
          </Pressable>
        )}
      </View>

      <View style={s.categoria}>
        <Icone nome={iconeCategoria[post.categoria] || 'leaf'} tamanho={15} cor={cor.gelo} />
        <Texto estilo={s.categoriaTexto}>{post.categoria}</Texto>
      </View>
      <Texto>{post.conteudo}</Texto>
      {post.url_foto ? (
        <Image source={{ uri: post.url_foto }} style={s.foto} resizeMode="cover" accessibilityLabel={`Foto da ação de ${post.nome}`} />
      ) : null}
      {post.patrocinador ? (
        <View style={s.patrocinio}>
          <Icone nome="award" tamanho={14} cor={cor.textoSuave} />
          <Texto suave estilo={{ fontSize: 12 }}>Desafio patrocinado por <Texto forte estilo={{ fontSize: 12 }}>{post.patrocinador}</Texto></Texto>
        </View>
      ) : null}

      <View style={s.acoes}>
        <Pressable onPress={curtir} style={s.acao} accessibilityLabel="Curtir" accessibilityState={{ selected: curtiu }}>
          <Icone nome="heart" tamanho={19} cor={curtiu ? cor.gelo : cor.textoSuave} preenchido={curtiu} />
          <Texto estilo={[s.acaoTexto, curtiu && { color: cor.gelo }]}>{curtidas}</Texto>
        </Pressable>
        <Pressable onPress={aoComentar || (() => router.push(`/postagem/${post.id_postagem}`))} style={s.acao} accessibilityLabel="Comentários">
          <Icone nome="comment" tamanho={19} cor={cor.textoSuave} />
          <Texto estilo={s.acaoTexto}>{comentarios}</Texto>
        </Pressable>
        <Pressable onPress={compartilhar} style={s.acao} accessibilityLabel="Compartilhar">
          <Icone nome="share" tamanho={19} cor={cor.textoSuave} />
        </Pressable>
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  post: { padding: 16, gap: 12 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ptsChip: {
    fontFamily: fonte.tituloForte, fontSize: 13, color: cor.fundo, backgroundColor: cor.gelo,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2, overflow: 'hidden',
  },
  iconeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  categoria: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoriaTexto: { fontSize: 12, fontFamily: fonte.textoForte, color: cor.gelo, letterSpacing: 0.4, textTransform: 'uppercase' },
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: cor.superficie2, borderWidth: 1, borderColor: cor.borda },
  patrocinio: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  acoes: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: cor.borda, paddingTop: 4 },
  acao: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 8 },
  acaoTexto: { fontSize: 13, color: cor.textoSuave },
});
