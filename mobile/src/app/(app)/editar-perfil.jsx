// Editar o próprio perfil (abre como modal por cima do perfil)
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { limparUsuario } from '../../lib/util.js';
import { useAviso } from '../../components/Aviso.jsx';
import Icone from '../../components/Icone.jsx';
import Tela from '../../components/Tela.jsx';
import { Botao, Campo, Erro } from '../../components/ui.jsx';

export default function EditarPerfil() {
  const { usuario, atualizar } = useAuth();
  const avisar = useAviso();
  const [dados, setDados] = useState({ nome: usuario.nome, usuario: usuario.usuario, cidade: usuario.cidade || '', bio: usuario.bio || '' });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const mudar = (campo) => (v) => setDados({ ...dados, [campo]: campo === 'usuario' ? limparUsuario(v) : v });

  async function salvar() {
    setErro('');
    setEnviando(true);
    try {
      atualizar(await api('/auth/eu', { method: 'PUT', body: dados }));
      avisar('Perfil atualizado.');
      router.back();
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  return (
    <Tela
      titulo="Editar perfil"
      direita={(
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Fechar">
          <Icone nome="x" tamanho={22} />
        </Pressable>
      )}
    >
      <Campo rotulo="Nome" value={dados.nome} onChangeText={mudar('nome')} maxLength={120} autoComplete="name" />
      <Campo rotulo="Usuário" prefixo="@" value={dados.usuario} onChangeText={mudar('usuario')} maxLength={40}
        autoCapitalize="none" autoCorrect={false} autoComplete="username" dica="Letras minúsculas, números, ponto e _." />
      <Campo rotulo="Cidade" value={dados.cidade} onChangeText={mudar('cidade')} maxLength={80} placeholder="Onde você mora" />
      <Campo rotulo={`Bio · ${dados.bio.length}/280`} value={dados.bio} onChangeText={mudar('bio')} maxLength={280} multiline
        placeholder="Conte um pouco sobre você" />
      <Erro>{erro}</Erro>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Botao tipo="secundario" onPress={() => router.back()}>Cancelar</Botao>
        <Botao estilo={{ flex: 1 }} onPress={salvar} carregando={enviando}>SALVAR</Botao>
      </View>
    </Tela>
  );
}
