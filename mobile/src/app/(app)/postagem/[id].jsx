// Uma postagem com os comentários (mais recentes primeiro) e o campo de comentar fixo embaixo
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../../lib/api.js';
import { useDados } from '../../../lib/useDados.js';
import { tempo } from '../../../lib/util.js';
import { cor, fonte, raio } from '../../../lib/tema.js';
import { useAviso } from '../../../components/Aviso.jsx';
import Postagem from '../../../components/Postagem.jsx';
import Tela, { voltar } from '../../../components/Tela.jsx';
import { Avatar, Botao, Card, Erro, Texto, Vazio } from '../../../components/ui.jsx';

export default function Comentarios() {
  const { id } = useLocalSearchParams();
  const avisar = useAviso();
  const insets = useSafeAreaInsets();
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const campo = useRef(null);

  const carregar = useCallback(async () => {
    const [post, comentarios] = await Promise.all([api(`/postagens/${id}`), api(`/postagens/${id}/comentarios`)]);
    return { post, comentarios };
  }, [id]);
  const { dados, setDados, erro, atualizando, atualizar } = useDados(carregar);

  async function comentar() {
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    try {
      const novo = await api(`/postagens/${id}/comentarios`, { method: 'POST', body: { texto } });
      setDados((d) => ({ post: { ...d.post, comentarios: d.post.comentarios + 1 }, comentarios: [novo, ...d.comentarios] }));
      setTexto('');
    } catch (err) {
      avisar(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const rodape = dados && (
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

      {dados && (<>
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
            </View>
          ))}
        </Card>
      </>)}
    </Tela>
  );
}

const s = StyleSheet.create({
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
