// Uma postagem com os comentários (mais recentes primeiro) e o campo de comentar fixo embaixo
import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../../lib/api.js';
import { useAoVivo } from '../../../lib/aoVivo.js';
import { useAuth } from '../../../lib/auth.jsx';
import { useDados } from '../../../lib/useDados.js';
import { tempo } from '../../../lib/util.js';
import { cor, fonte, raio } from '../../../lib/tema.js';
import { useAviso } from '../../../components/Aviso.jsx';
import Icone from '../../../components/Icone.jsx';
import Postagem from '../../../components/Postagem.jsx';
import Tela, { voltar } from '../../../components/Tela.jsx';
import { Avatar, Botao, Card, Erro, Texto, Vazio } from '../../../components/ui.jsx';

export default function Comentarios() {
  const { id } = useLocalSearchParams();
  const { usuario } = useAuth();
  const avisar = useAviso();
  const insets = useSafeAreaInsets();
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const campo = useRef(null);

  const carregar = useCallback(async () => {
    // Admin também vê quem curtiu, para poder tirar a curtida (moderação)
    const [post, comentarios, curtidas] = await Promise.all([
      api(`/postagens/${id}`), api(`/postagens/${id}/comentarios`), usuario.admin ? api(`/postagens/${id}/curtidas`) : null,
    ]);
    return { post, comentarios, curtidas };
  }, [id, usuario.admin]);
  const { dados, setDados, erro, atualizando, atualizar } = useDados(carregar);
  const [apagada, setApagada] = useState(false);

  // Comentário novo de outra pessoa: busca a lista de novo pela API (o aviso só traz o id)
  useAoVivo((evento, aviso) => {
    if (aviso.id_postagem !== Number(id)) return;
    if (evento === 'novo_comentario' && dados && !dados.comentarios.some((c) => c.id_comentario === aviso.id_comentario)) {
      api(`/postagens/${id}/comentarios`).then((comentarios) => setDados((d) => d && { ...d, comentarios })).catch(() => {});
    } else if (evento === 'comentario_apagado') {
      setDados((d) => d && { ...d, comentarios: d.comentarios.filter((c) => c.id_comentario !== aviso.id_comentario) });
    } else if (evento === 'contadores' && dados?.curtidas && dados.curtidas.length !== aviso.curtidas) {
      api(`/postagens/${id}/curtidas`).then((curtidas) => setDados((d) => d && { ...d, curtidas })).catch(() => {});
    } else if (evento === 'postagem_apagada') {
      setApagada(true);
    }
  });

  async function comentar() {
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    try {
      const novo = await api(`/postagens/${id}/comentarios`, { method: 'POST', body: { texto } });
      // O aviso ao vivo pode ter trazido o comentário antes da resposta
      setDados((d) => d.comentarios.some((c) => c.id_comentario === novo.id_comentario)
        ? d
        : { ...d, post: { ...d.post, comentarios: d.post.comentarios + 1 }, comentarios: [novo, ...d.comentarios] });
      setTexto('');
    } catch (err) {
      avisar(err.message);
    } finally {
      setEnviando(false);
    }
  }

  // O autor apaga o próprio comentário; admin apaga qualquer um
  function confirmarApagarComentario(c) {
    Alert.alert('Apagar este comentário?', c.texto.length > 80 ? `${c.texto.slice(0, 80)}…` : c.texto, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar', style: 'destructive',
        onPress: async () => {
          try {
            const r = await api(`/postagens/${id}/comentarios/${c.id_comentario}`, { method: 'DELETE' });
            setDados((d) => ({ ...d, post: { ...d.post, comentarios: r.comentarios }, comentarios: d.comentarios.filter((x) => x.id_comentario !== c.id_comentario) }));
            avisar('Comentário apagado.');
          } catch (err) {
            avisar(err.message);
          }
        },
      },
    ]);
  }

  async function tirarCurtida(u) {
    try {
      const r = await api(`/postagens/${id}/curtidas/${u.id_usuario}`, { method: 'DELETE' });
      setDados((d) => ({
        ...d,
        post: { ...d.post, curtidas: r.curtidas, curtiu: u.id_usuario === usuario.id_usuario ? false : d.post.curtiu },
        curtidas: d.curtidas.filter((x) => x.id_usuario !== u.id_usuario),
      }));
      avisar(`Curtida de @${u.usuario} removida.`);
    } catch (err) {
      avisar(err.message);
    }
  }

  const rodape = dados && !apagada && (
    <View style={[s.comentar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <TextInput
        ref={campo}
        value={texto}
        onChangeText={setTexto}
        placeholder="Escreva um comentário"
        placeholderTextColor={cor.placeholder}
        selectionColor={cor.gelo}
        maxLength={500}
        multiline
        style={s.campo}
        accessibilityLabel="Seu comentário"
      />
      <Botao pequeno onPress={comentar} carregando={enviando} disabled={!texto.trim()}>ENVIAR</Botao>
    </View>
  );

  return (
    <Tela titulo="Comentários" comVoltar aoAtualizar={atualizar} atualizando={atualizando} rodape={rodape}>
      {erro && !dados ? (<>
        <Erro>{erro}</Erro>
        <Botao tipo="secundario" onPress={() => router.replace('/')}>Voltar para o feed</Botao>
      </>) : null}
      {!dados && !erro && <Vazio>Carregando…</Vazio>}
      {apagada && (<>
        <Vazio>Essa postagem foi apagada.</Vazio>
        <Botao tipo="secundario" onPress={() => router.replace('/')}>Voltar para o feed</Botao>
      </>)}

      {dados && !apagada && (<>
        <Postagem post={dados.post} aoComentar={() => campo.current?.focus()} aoApagar={voltar} />
        <Card estilo={{ padding: 16, gap: 16 }}>
          {dados.comentarios.length === 0 && <Vazio>Ninguém comentou ainda. Seja a primeira pessoa.</Vazio>}
          {dados.comentarios.map((c) => (
            <View key={c.id_comentario} style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={() => router.push(`/perfil/${c.id_usuario}`)}><Avatar nome={c.nome} tamanho={36} /></Pressable>
              <View style={{ flex: 1 }}>
                <Texto estilo={{ fontSize: 13, lineHeight: 18 }}>
                  <Texto forte estilo={{ fontSize: 13 }} onPress={() => router.push(`/perfil/${c.id_usuario}`)}>{c.nome}</Texto>
                  <Texto suave estilo={{ fontSize: 12 }}>  @{c.usuario} · {tempo(c.data_comentario)}</Texto>
                </Texto>
                <Texto estilo={{ fontSize: 14, lineHeight: 20 }}>{c.texto}</Texto>
              </View>
              {(c.id_usuario === usuario.id_usuario || usuario.admin) && (
                <Pressable onPress={() => confirmarApagarComentario(c)} hitSlop={8} style={s.lixeira} accessibilityLabel="Apagar comentário">
                  <Icone nome="lixeira" tamanho={16} cor={cor.textoSuave} />
                </Pressable>
              )}
            </View>
          ))}
        </Card>

        {/* Só admin: quem curtiu, com a opção de tirar a curtida */}
        {dados.curtidas?.length > 0 && (
          <Card estilo={{ padding: 16, gap: 12 }}>
            <Texto titulo estilo={{ fontSize: 15 }}>Curtidas</Texto>
            {dados.curtidas.map((u) => (
              <View key={u.id_usuario} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Pressable onPress={() => router.push(`/perfil/${u.id_usuario}`)}><Avatar nome={u.nome} tamanho={32} /></Pressable>
                <View style={{ flex: 1 }}>
                  <Texto forte estilo={{ fontSize: 13, lineHeight: 18 }}>{u.nome}</Texto>
                  <Texto suave estilo={{ fontSize: 12, lineHeight: 16 }}>@{u.usuario} · {tempo(u.data_curtida)}</Texto>
                </View>
                <Pressable onPress={() => tirarCurtida(u)} hitSlop={8} style={s.lixeira} accessibilityLabel={`Tirar a curtida de @${u.usuario}`}>
                  <Icone nome="x" tamanho={16} cor={cor.textoSuave} />
                </Pressable>
              </View>
            ))}
          </Card>
        )}
      </>)}
    </Tela>
  );
}

const s = StyleSheet.create({
  lixeira: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  comentar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: cor.borda, backgroundColor: cor.superficie,
  },
  campo: {
    flex: 1, minHeight: 40, maxHeight: 120, paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: raio.campo, borderWidth: 1, borderColor: cor.borda, backgroundColor: cor.fundo,
    color: cor.texto, fontFamily: fonte.texto, fontSize: 15,
  },
});
