// Painel de administração: buscar contas e abrir para editar ou apagar.
// Postagens, comentários e curtidas se moderam onde aparecem (lixeira no card e na tela de comentários).
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { api } from '../../../lib/api.js';
import { useAuth } from '../../../lib/auth.jsx';
import { useDados } from '../../../lib/useDados.js';
import { fmt } from '../../../lib/util.js';
import { cor, fonte } from '../../../lib/tema.js';
import Icone from '../../../components/Icone.jsx';
import Tela from '../../../components/Tela.jsx';
import { Avatar, Campo, Card, Erro, Texto, Vazio } from '../../../components/ui.jsx';

export default function Admin() {
  const { usuario } = useAuth();
  const [texto, setTexto] = useState('');
  const [busca, setBusca] = useState('');
  const carregar = useCallback(() => api(`/admin/usuarios?q=${encodeURIComponent(busca)}`), [busca]);
  const { dados: lista, erro, atualizando, atualizar } = useDados(carregar);

  if (!usuario.admin) return <Redirect href="/" />;

  return (
    <Tela titulo="Admin" comVoltar aoAtualizar={atualizar} atualizando={atualizando}>
      <Texto suave estilo={{ fontSize: 14 }}>
        Edite ou apague contas aqui. Para apagar postagens, comentários ou curtidas, use a lixeira onde eles aparecem.
      </Texto>
      <Campo value={texto} onChangeText={setTexto} placeholder="Nome, @usuário ou e-mail" autoCapitalize="none" autoCorrect={false}
        returnKeyType="search" onSubmitEditing={() => setBusca(texto.trim())} accessibilityLabel="Buscar contas" />

      <Erro>{erro}</Erro>
      {lista === null && !erro && <Vazio>Carregando…</Vazio>}
      {lista?.length === 0 && <Vazio>Nenhuma conta encontrada.</Vazio>}
      {lista && lista.length > 0 && (
        <Card estilo={{ paddingHorizontal: 16 }}>
          {lista.map((u, i) => (
            <Pressable key={u.id_usuario} onPress={() => router.push(`/admin/${u.id_usuario}`)}
              style={[s.linha, i > 0 && s.divisoria]} accessibilityRole="button" accessibilityLabel={`Editar ${u.nome}`}>
              <Avatar nome={u.nome} tamanho={40} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Texto forte estilo={{ fontSize: 14, lineHeight: 18 }}>{u.nome}</Texto>
                  {u.admin && (
                    <View style={s.selo}>
                      <Icone nome="escudo" tamanho={12} cor={cor.gelo} />
                      <Texto estilo={s.seloTexto}>Admin</Texto>
                    </View>
                  )}
                </View>
                <Texto suave numberOfLines={1} estilo={{ fontSize: 12, lineHeight: 16 }}>@{u.usuario} · {u.email}</Texto>
                <Texto suave estilo={{ fontSize: 12, lineHeight: 16 }}>
                  {fmt(u.pontos_ecologicos)} pts · nível {u.nivel} · {u.postagens} {u.postagens === 1 ? 'postagem' : 'postagens'}
                </Texto>
              </View>
              <Icone nome="edit" tamanho={18} cor={cor.textoSuave} />
            </Pressable>
          ))}
        </Card>
      )}
    </Tela>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  divisoria: { borderTopWidth: 1, borderTopColor: cor.borda },
  selo: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: cor.superficie2 },
  seloTexto: { fontFamily: fonte.textoForte, fontSize: 11, lineHeight: 14, color: cor.gelo },
});
